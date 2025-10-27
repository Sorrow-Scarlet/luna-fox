// 工具管理器类 - 处理工具选择和特定工具功能
class ToolManager {
  constructor(state) {
    this.state = state;
  }

  // 初始化工具功能
  initialize(toolBtns) {
    // 工具选择处理
    toolBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleToolSelection(e));
    });

    // 初始化鼠标样式
    this.updateCursor();
  }

  // 处理工具选择
  handleToolSelection(e) {
    // 移除所有工具按钮的active状态
    document.querySelectorAll(".tool-btn[data-tool]").forEach((b) => {
      b.classList.remove("active");
    });

    // 设置当前工具
    if (e.currentTarget.dataset.tool) {
      this.state.currentTool = e.currentTarget.dataset.tool;
      e.currentTarget.classList.add("active");
      this.updateCursor();

      // 如果当前有选中的元素，根据工具类型处理调整手柄
      this.handleSelectedElement();
    }
  }

  // 处理选中元素的状态
  handleSelectedElement() {
    if (this.state.selectedElement) {
      if (this.state.currentTool === "move") {
        // 重新添加调整手柄
        if (window.app && window.app.elementManager) {
          window.app.elementManager.removeResizeHandles();
          window.app.elementManager.addResizeHandles(
            this.state.selectedElement
          );
        }
      } else {
        // 移除调整手柄
        if (window.app && window.app.elementManager) {
          window.app.elementManager.removeResizeHandles();
        }
      }
    }
  }

  // 更新鼠标样式
  updateCursor() {
    // 使用全局app实例的画布管理器
    if (window.app && window.app.canvasManager) {
      window.app.canvasManager.updateCursor();
    }
  }

  // 获取当前工具
  getCurrentTool() {
    return this.state.currentTool;
  }

  // 设置当前工具
  setCurrentTool(tool) {
    this.state.currentTool = tool;
    this.updateCursor();
    this.handleSelectedElement();
  }
}
