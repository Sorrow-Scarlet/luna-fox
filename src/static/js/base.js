// 基础模块 - 提供DOM元素和全局状态管理
document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  window.designerCanvas = document.getElementById("designerCanvas");
  window.canvasOverlay = document.getElementById("canvasOverlay");
  window.selectionBox = document.getElementById("selectionBox");
  window.undoBtn = document.getElementById("undoBtn");
  window.redoBtn = document.getElementById("redoBtn");
  window.clearBtn = document.getElementById("clearBtn");
  window.coordinatesDisplay = document.getElementById("coordinates");
  window.toolBtns = document.querySelectorAll(".tool-btn");

  // 应用状态
  window.appState = {
    currentTool: "move",
    isDrawing: false,
    startX: 0,
    startY: 0,
    selectedElement: null,
    designElements: [],
    history: [],
    historyIndex: -1,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    elementOffsetX: 0,
    elementOffsetY: 0,
    // 中梃绘制相关状态
    isMullionDrawing: false,
    mullionStartPoint: null,
    mullionEndPoint: null,
    mullionIndicator: null,
    // 保存状态
    isSaved: false,
  };

  // 等待所有模块加载完成后初始化
  window.initializeApp = function () {
    // 防止重复初始化
    if (window.appInitialized) return;

    // 确保所有依赖模块都已加载
    if (
      window.initCanvas &&
      window.initHistory &&
      window.initElements &&
      window.initTools &&
      window.initEvents
    ) {
      window.appInitialized = true;

      // 初始化各个模块
      window.initCanvas();
      window.initHistory();
      window.initElements();
      window.initTools();
      window.initEvents();

      console.log("应用初始化完成");
      return true;
    }
    return false;
  };

  // 尝试初始化，如果失败则使用轮询机制
  if (!window.initializeApp()) {
    // 轮询直到所有模块都加载完成
    const initInterval = setInterval(() => {
      if (window.initializeApp()) {
        clearInterval(initInterval);
      }
    }, 50);

    // 设置最大尝试时间（5秒）
    setTimeout(() => {
      clearInterval(initInterval);
      if (!window.appInitialized) {
        console.error("应用初始化超时，可能缺少必要的模块");
      }
    }, 5000);
  }
});
