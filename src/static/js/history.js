// 历史记录模块 - 处理撤销、重做和历史记录管理
document.addEventListener("DOMContentLoaded", function () {
  // 初始化历史记录功能
  window.initHistory = function () {
    // 绑定按钮事件
    window.undoBtn.addEventListener("click", undo);
    window.redoBtn.addEventListener("click", redo);
    window.clearBtn.addEventListener("click", function () {
      if (confirm("确定要清除所有设计吗？")) {
        saveHistory();
        clearDesign();
      }
    });
  };

  // 记录历史
  window.saveHistory = function () {
    const state = window.appState;
    // 移除当前状态之后的历史记录
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    // 保存当前状态的副本
    const currentState = JSON.parse(JSON.stringify(state.designElements));
    state.history.push(currentState);
    state.historyIndex = state.history.length - 1;
  };

  // 撤销操作
  function undo() {
    const state = window.appState;
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreFromHistory();
    }
  }

  // 重做操作
  function redo() {
    const state = window.appState;
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreFromHistory();
    }
  }

  // 从历史记录恢复
  function restoreFromHistory() {
    const state = window.appState;
    const savedState = state.history[state.historyIndex];

    if (!savedState) return;

    // 先清除设计
    clearDesign();

    // 然后重新添加元素
    savedState.forEach((element) => {
      window.addElement(element);
    });
  }

  // 清除设计
  window.clearDesign = function () {
    // 安全地清除元素，避免可能的死循环
    if (!window.designerCanvas || !window.canvasOverlay) return;

    // 获取除了canvasOverlay之外的所有元素
    const elements = Array.from(window.designerCanvas.children).filter(
      (child) => child !== window.canvasOverlay
    );

    // 逐个移除元素，避免innerHTML清空带来的问题
    elements.forEach((element) => {
      if (element.parentNode === window.designerCanvas) {
        window.designerCanvas.removeChild(element);
      }
    });

    // 重置应用状态
    window.appState.designElements = [];
    window.appState.selectedElement = null;
    window.appState.isSaved = false;
    window.appState.isDrawing = false;
    window.appState.isDragging = false;
    window.appState.isResizing = false;
    window.appState.isMullionDrawing = false;
  };

  // 初始化由base.js统一控制，不再需要通知主模块
});
