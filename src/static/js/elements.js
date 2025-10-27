// 元素管理模块 - 处理元素的添加、选择和调整等功能
document.addEventListener("DOMContentLoaded", function () {
  // 初始化元素管理功能
  window.initElements = function () {
    // 元素管理功能已通过函数导出，无需额外初始化
  };

  // 添加元素到画布
  window.addElement = function (elementData) {
    const element = document.createElement("div");
    element.classList.add("drawn-element");
    element.style.left = elementData.x + "px";
    element.style.top = elementData.y + "px";
    element.style.width = elementData.width + "px";
    element.style.height = elementData.height + "px";
    element.dataset.type = elementData.type;

    // 根据元素类型添加特定样式
    if (elementData.type === "border") {
      element.classList.add("border-element");
      // 创建矩形环（空心矩形）效果
      element.style.backgroundColor = "#009456";
      element.style.border = "3px solid #333";

      // 在内部距离描边10px的位置创建一个相同的矩形
      const innerBorder = document.createElement("div");
      innerBorder.classList.add("drawn-element", "inner-border");
      innerBorder.style.position = "absolute";

      // 使用统一的padding变量，确保计算一致
      const padding = 10;
      // 内部矩形的边框宽度
      const innerBorderWidth = 3;

      // 计算内部矩形的大小，考虑内矩形自身的边框宽度，确保与外部矩形四边都保持10px间距
      // 公式：内部矩形宽度 = 外部矩形宽度 - 2 * 内边距 - 2 * 内部矩形边框宽度
      const innerWidth = Math.max(
        20,
        elementData.width - padding * 2 - innerBorderWidth * 2
      );
      const innerHeight = Math.max(
        20,
        elementData.height - padding * 2 - innerBorderWidth * 2
      );

      // 精确设置内部矩形的位置和大小
      innerBorder.style.left = padding + "px";
      innerBorder.style.top = padding + "px";
      innerBorder.style.width = innerWidth + "px";
      innerBorder.style.height = innerHeight + "px";
      innerBorder.style.backgroundColor = "white";
      innerBorder.style.border = "3px solid #333";
      innerBorder.style.pointerEvents = "none"; // 避免内部矩形影响点击交互
      element.appendChild(innerBorder);
    } else if (elementData.type === "mullion") {
      // 中梃元素样式 - 10px粗，与外矩形色彩一致
      element.classList.add("mullion-element");
      element.style.backgroundColor = "#802040";
      element.style.border = "none";
      element.style.zIndex = "20";
    } else if (elementData.type === "grid") {
      element.classList.add("grid-element");
    } else if (elementData.type === "sash-with-screen") {
      element.classList.add("sash-element", "with-screen");
    } else if (elementData.type === "sash-no-screen") {
      element.classList.add("sash-element", "no-screen");
    }

    // 添加到画布
    window.designerCanvas.insertBefore(element, window.canvasOverlay);

    // 添加点击事件
    element.addEventListener("click", function (e) {
      e.stopPropagation();
      selectElement(element);
    });

    // 保存到设计元素数组
    window.appState.designElements.push(elementData);

    return element;
  };

  // 选择元素
  function selectElement(element) {
    const state = window.appState;
    // 取消之前的选择
    if (state.selectedElement) {
      state.selectedElement.classList.remove("selected");
      removeResizeHandles();
    }

    // 选择新元素
    state.selectedElement = element;
    element.classList.add("selected");

    // 添加调整手柄
    if (state.currentTool === "move") {
      // 确保先移除所有现有手柄
      removeResizeHandles();
      addResizeHandles(element);
    }
  }

  // 添加调整手柄
  function addResizeHandles(element) {
    if (!element) return;

    // 移除可能存在的旧手柄
    removeResizeHandles();

    // 添加八个调整手柄（四个角和四个边）
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    handles.forEach((position) => {
      const handle = document.createElement("div");
      handle.classList.add("resize-handle", position);
      element.appendChild(handle);

      // 添加鼠标按下事件
      handle.addEventListener("mousedown", function (e) {
        e.stopPropagation();
        window.appState.isResizing = true;
        window.appState.resizeHandle = position;

        // 准备历史记录
        window.saveHistory();
      });
    });
  }

  // 移除调整手柄
  function removeResizeHandles() {
    const handles = document.querySelectorAll(".resize-handle");
    handles.forEach((handle) => handle.remove());
  }

  // 获取元素对应的设计数据
  window.getElementData = function (element) {
    const state = window.appState;

    // 尝试通过元素的唯一标识查找数据
    // 这里使用位置索引作为临时解决方案
    // 在实际应用中应该为每个元素添加唯一ID
    const elements = Array.from(window.designerCanvas.children).filter(
      (child) => child !== window.canvasOverlay
    );

    const index = elements.indexOf(element);

    if (index !== -1 && index < state.designElements.length) {
      return state.designElements[index];
    }

    return null;
  };

  // 更新元素数据
  window.updateElementData = function (element) {
    const state = window.appState;
    const targetElement = element || state.selectedElement;

    if (!targetElement) return;

    // 获取对应的设计数据
    const elementData = window.getElementData(targetElement);

    if (elementData) {
      // 更新数据，使用Math.floor确保整数
      elementData.x = Math.floor(parseInt(targetElement.style.left) || 0);
      elementData.y = Math.floor(parseInt(targetElement.style.top) || 0);
      elementData.width = Math.floor(parseInt(targetElement.style.width) || 0);
      elementData.height = Math.floor(
        parseInt(targetElement.style.height) || 0
      );
    }

    // 更新内部矩形的大小和位置，确保始终与外矩形四边保持10px的间距
    const innerBorder = state.selectedElement.querySelector(".inner-border");
    if (innerBorder) {
      // 获取外部矩形的实际大小（不含边框）
      const outerWidth = parseInt(state.selectedElement.style.width);
      const outerHeight = parseInt(state.selectedElement.style.height);

      // 计算内部矩形的大小，确保与外部矩形四边都保持10px间距
      const padding = 10;
      // 内部矩形的边框宽度
      const innerBorderWidth = 3;

      // 计算内部矩形的大小，考虑内矩形自身的边框宽度
      // 公式：内部矩形宽度 = 外部矩形宽度 - 2 * 内边距 - 2 * 内部矩形边框宽度
      const innerWidth = Math.max(
        20,
        outerWidth - padding * 2 - innerBorderWidth * 2
      );
      const innerHeight = Math.max(
        20,
        outerHeight - padding * 2 - innerBorderWidth * 2
      );

      // 精确设置内部矩形的位置和大小
      innerBorder.style.left = padding + "px";
      innerBorder.style.top = padding + "px";
      innerBorder.style.width = innerWidth + "px";
      innerBorder.style.height = innerHeight + "px";
    }
  };

  // 初始化由base.js统一控制，不再需要通知主模块
});
