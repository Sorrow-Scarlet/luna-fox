// 历史记录管理器类 - 处理撤销、重做和历史记录管理
class HistoryManager {
  constructor(state) {
    this.state = state;
  }

  // 初始化历史记录功能
  initialize(undoBtn, redoBtn, clearBtn) {
    // 绑定按钮事件
    undoBtn.addEventListener("click", () => this.undo());
    redoBtn.addEventListener("click", () => this.redo());
    clearBtn.addEventListener("click", () => {
      if (confirm("确定要清除所有设计吗？")) {
        this.saveHistory();
        this.clearDesign();
      }
    });
  }

  // 记录历史
  saveHistory() {
    // 移除当前状态之后的历史记录
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.history = this.state.history.slice(
        0,
        this.state.historyIndex + 1
      );
    }

    // 保存当前状态的副本
    const currentState = JSON.parse(JSON.stringify(this.state.designElements));
    this.state.history.push(currentState);
    this.state.historyIndex = this.state.history.length - 1;
  }

  // 撤销操作
  undo() {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      this.restoreFromHistory();
    }
  }

  // 重做操作
  redo() {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      this.restoreFromHistory();
    }
  }

  // 从历史记录恢复
  restoreFromHistory() {
    const savedState = this.state.history[this.state.historyIndex];

    if (!savedState) return;

    // 先清除设计
    this.clearDesign();

    // 然后重新添加元素
    savedState.forEach((element) => {
      // 使用全局app实例的元素管理器
      if (window.app && window.app.elementManager) {
        window.app.elementManager.addElement(element);
      }
    });
  }

  // 清除设计
  clearDesign() {
    // 使用全局app实例的元素管理器
    if (window.app && window.app.elementManager) {
      window.app.elementManager.clearAllElements();
    }

    // 重置保存状态
    this.state.isSaved = false;
  }
}
