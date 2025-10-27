// 工具管理模块 - 处理工具选择和特定工具功能
document.addEventListener("DOMContentLoaded", function () {
  // 初始化工具功能
  window.initTools = function () {
    // 工具选择处理
    window.toolBtns.forEach((btn) => {
      btn.addEventListener("click", handleToolSelection);
    });
    // 初始化鼠标样式
    window.updateCursor();
  };

  // 处理工具选择
  function handleToolSelection() {
    const state = window.appState;
    // 移除所有工具按钮的active状态
    document.querySelectorAll(".tool-btn[data-tool]").forEach((b) => {
      b.classList.remove("active");
    });

    // 设置当前工具
    if (this.dataset.tool) {
      state.currentTool = this.dataset.tool;
      this.classList.add("active");
      window.updateCursor();

      // 如果当前有选中的元素，根据工具类型处理调整手柄
      if (state.selectedElement) {
        if (state.currentTool === "move") {
          // 重新添加调整手柄
          // 注意：addResizeHandles函数已在elements.js中定义
          const element = state.selectedElement;
          // 先移除旧手柄
          const oldHandles = document.querySelectorAll(".resize-handle");
          oldHandles.forEach((handle) => handle.remove());
          // 调用elements.js中的函数添加手柄
          if (window.addResizeHandles) {
            window.addResizeHandles(element);
          }
        } else {
          // 移除调整手柄
          const handles = document.querySelectorAll(".resize-handle");
          handles.forEach((handle) => handle.remove());
        }
      }
    }
  }

  // 初始化由base.js统一控制，不再需要通知主模块
});
