// 主应用类 - 负责协调各个模块
class App {
  constructor() {
    this.canvas = null;
    this.canvasOverlay = null;
    this.selectionBox = null;
    this.undoBtn = null;
    this.redoBtn = null;
    this.clearBtn = null;
    this.coordinatesDisplay = null;
    this.toolBtns = null;

    this.state = null;
    this.canvasManager = null;
    this.elementManager = null;
    this.eventManager = null;
    this.historyManager = null;
    this.toolManager = null;

    this.initialized = false;
  }

  // 初始化应用
  initialize() {
    if (this.initialized) return;

    // 获取DOM元素
    this.getDOMElements();

    // 初始化状态
    this.state = new AppState();

    // 初始化各个管理器
    this.canvasManager = new CanvasManager(
      this.canvas,
      this.canvasOverlay,
      this.state
    );
    this.elementManager = new ElementManager(
      this.canvas,
      this.canvasOverlay,
      this.state
    );
    this.historyManager = new HistoryManager(this.state);
    this.toolManager = new ToolManager(this.state);
    this.eventManager = new EventManager(
      this.canvas,
      this.canvasOverlay,
      this.selectionBox,
      this.state,
      this.elementManager,
      this.toolManager,
      this.historyManager
    );

    // 初始化各个模块
    this.canvasManager.initialize();
    this.historyManager.initialize(this.undoBtn, this.redoBtn, this.clearBtn);
    this.toolManager.initialize(this.toolBtns);
    this.eventManager.initialize();

    this.initialized = true;
    console.log("应用初始化完成");
  }

  // 获取DOM元素
  getDOMElements() {
    this.canvas = document.getElementById("designerCanvas");
    this.canvasOverlay = document.getElementById("canvasOverlay");
    this.selectionBox = document.getElementById("selectionBox");
    this.undoBtn = document.getElementById("undoBtn");
    this.redoBtn = document.getElementById("redoBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.coordinatesDisplay = document.getElementById("coordinates");
    this.toolBtns = document.querySelectorAll(".tool-btn");
  }

  // 获取应用实例（单例模式）
  static getInstance() {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }
}

// 应用状态类
class AppState {
  constructor() {
    this.currentTool = "move";
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.selectedElement = null;
    this.designElements = [];
    this.history = [];
    this.historyIndex = -1;
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.elementOffsetX = 0;
    this.elementOffsetY = 0;
    this.isMullionDrawing = false;
    this.mullionStartPoint = null;
    this.mullionEndPoint = null;
    this.mullionIndicator = null;
    this.isSaved = false;

    // 中梃相关状态
    this.mullionWidth = 10; // 中梃宽度10px
    this.mullionSplitRatio = 0.5; // 默认分割比例
    this.activeMullion = null; // 当前激活的中梃

    // 中梃与边框的组合关系
    this.mullionGroups = new Map(); // key: 边框元素, value: 中梃元素数组
  }
}

// 全局应用实例
window.app = App.getInstance();

// DOM加载完成后初始化应用
document.addEventListener("DOMContentLoaded", function () {
  window.app.initialize();
});
