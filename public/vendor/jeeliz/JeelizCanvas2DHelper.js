/*
 * Jeeliz FaceFilter — Canvas2D helper (Apache-2.0)
 * https://github.com/jeeliz/jeelizFaceFilter/blob/master/helpers/JeelizCanvas2DHelper.js
 */
window.JeelizCanvas2DHelper = function (spec) {
  var GL = spec.GL;
  var CV = spec.canvasElement;
  var VIDEOTEXTURE = spec.videoTexture;
  var VIDEOTEXTURETRANSFORMMAT2 = spec.videoTransformMat2;

  var CANVAS2D = document.createElement("canvas");
  CANVAS2D.width = CV.width;
  CANVAS2D.height = CV.height;
  var CTX = CANVAS2D.getContext("2d");

  var CANVASTEXTURE = GL.createTexture();
  GL.bindTexture(GL.TEXTURE_2D, CANVASTEXTURE);
  GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, CANVAS2D);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

  function compile_shader(source, glType, typeString) {
    var glShader = GL.createShader(glType);
    GL.shaderSource(glShader, source);
    GL.compileShader(glShader);
    if (!GL.getShaderParameter(glShader, GL.COMPILE_STATUS)) {
      console.error("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(glShader));
      return null;
    }
    return glShader;
  }

  function build_shaderProgram(shaderVertexSource, shaderFragmentSource, id) {
    var glShaderVertex = compile_shader(shaderVertexSource, GL.VERTEX_SHADER, "VERTEX " + id);
    var glShaderFragment = compile_shader(shaderFragmentSource, GL.FRAGMENT_SHADER, "FRAGMENT " + id);
    var glShaderProgram = GL.createProgram();
    GL.attachShader(glShaderProgram, glShaderVertex);
    GL.attachShader(glShaderProgram, glShaderFragment);
    GL.linkProgram(glShaderProgram);
    return glShaderProgram;
  }

  var copyVertexShaderSource =
    "attribute vec2 position;\n" +
    "uniform mat2 UVTransformMat2;\n" +
    "varying vec2 vUV;\n" +
    "void main(void){\n" +
    " gl_Position = vec4(position, 0., 1.);\n" +
    " vUV = vec2(0.5,0.5) + UVTransformMat2 * position;\n" +
    "}";

  var copyFragmentShaderSource =
    "precision lowp float;\n" +
    "uniform sampler2D samplerImage;\n" +
    "varying vec2 vUV;\n" +
    "void main(void){\n" +
    " gl_FragColor = texture2D(samplerImage, vUV);\n" +
    "}";

  var SHADERCOPY = build_shaderProgram(copyVertexShaderSource, copyFragmentShaderSource, "VIDEO");
  var uSampler = GL.getUniformLocation(SHADERCOPY, "samplerImage");
  var UUVTRANSFORM = GL.getUniformLocation(SHADERCOPY, "UVTransformMat2");
  GL.useProgram(SHADERCOPY);
  GL.uniform1i(uSampler, 0);

  var CANVASTEXTURENEEDSUPDATE = false;
  var COORDINATES = { x: 0, y: 0, w: 0, h: 0, s: 0 };

  return {
    canvas: CANVAS2D,
    ctx: CTX,
    update_canvasTexture: function () {
      CANVASTEXTURENEEDSUPDATE = true;
    },
    draw: function () {
      GL.viewport(0, 0, CV.width, CV.height);
      GL.useProgram(SHADERCOPY);
      GL.enable(GL.BLEND);
      GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
      GL.bindTexture(GL.TEXTURE_2D, VIDEOTEXTURE);
      GL.uniformMatrix2fv(UUVTRANSFORM, false, VIDEOTEXTURETRANSFORMMAT2);
      GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
      GL.bindTexture(GL.TEXTURE_2D, CANVASTEXTURE);
      GL.uniformMatrix2fv(UUVTRANSFORM, false, [0.5, 0, 0, 0.5]);
      if (CANVASTEXTURENEEDSUPDATE) {
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, CANVAS2D);
        CANVASTEXTURENEEDSUPDATE = false;
      }
      GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
      GL.disable(GL.BLEND);
    },
    getCoordinates: function (detectedState) {
      COORDINATES.x = Math.round((0.5 + 0.5 * detectedState.x - 0.5 * detectedState.s) * CV.width);
      COORDINATES.y = Math.round((0.5 + 0.5 * detectedState.y - 0.5 * detectedState.s) * CV.height);
      COORDINATES.w = Math.round(detectedState.s * CV.width);
      COORDINATES.h = COORDINATES.w;
      return COORDINATES;
    },
    resize: function () {
      CANVAS2D.width = CV.width;
      CANVAS2D.height = CV.height;
    },
  };
};
