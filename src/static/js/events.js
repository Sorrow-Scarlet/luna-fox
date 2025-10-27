// 事件处理模块 - 处理所有鼠标事件和交互逻辑
document.addEventListener("DOMContentLoaded", function () {
  // 初始化事件监听
  window.initEvents = function () {
    // 绑定事件监听器
    window.designerCanvas.addEventListener("mousedown", handleCanvasMouseDown);
    window.designerCanvas.addEventListener("mousemove", handleCanvasMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
  };

  // 获取相对于画布的坐标
  function getCanvasCoordinates(event) {
    const canvasRect = window.designerCanvas.getBoundingClientRect();
    return {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top,
    };
  }

  // 鼠标按下事件
  function handleCanvasMouseDown(e) {
    const state = window.appState;
    if (
      !state ||
      e.target === window.canvasOverlay ||
      e.target === window.selectionBox
    )
      return;

    // 如果点击的是画布背景，取消选择
    if (e.target === window.designerCanvas) {
      if (state.selectedElement) {
        state.selectedElement.classList.remove("selected");
        const handles = document.querySelectorAll(".resize-handle");
        handles.forEach((handle) => handle.remove());
        state.selectedElement = null;
      }

      // 如果当前工具不是移动工具，开始绘制
      if (state.currentTool !== "move") {
        if (state.currentTool === "mullion") {
          // 中梃绘制特殊处理
          state.isMullionDrawing = true;
          const coords = getCanvasCoordinates(e);
          state.mullionStartPoint = coords;
          state.mullionEndPoint = { ...coords };
          window.updateMullionIndicator();
        } else {
          // 其他工具的标准绘制
          state.isDrawing = true;
          const coords = getCanvasCoordinates(e);
          state.startX = coords.x;
          state.startY = coords.y;

          // 显示选择框
          window.selectionBox.style.display = "block";
          window.selectionBox.style.left = state.startX + "px";
          window.selectionBox.style.top = state.startY + "px";
          window.selectionBox.style.width = "0px";
          window.selectionBox.style.height = "0px";
        }
      }
    } else if (e.target.classList.contains("drawn-element")) {
      // 点击的是元素 - 委托给elements.js中的selectElement函数处理
      // 停止事件冒泡，避免触发画布的点击事件
      e.stopPropagation();

      // 如果是移动工具，准备拖拽
      if (state.currentTool === "move") {
        // 先调用selectElement函数选择元素
        if (window.selectElement) {
          window.selectElement(e.target);
        }

        state.isDragging = true;
        const elementRect = e.target.getBoundingClientRect();
        const canvasRect = window.designerCanvas.getBoundingClientRect();

        state.elementOffsetX = e.clientX - elementRect.left;
        state.elementOffsetY = e.clientY - elementRect.top;

        // 准备历史记录
        window.saveHistory();
      }
    }
  }

  // 鼠标移动事件
  function handleCanvasMouseMove(e) {
    const state = window.appState;
    if (!state) return;

    // 更新坐标显示
    const coords = getCanvasCoordinates(e);
    window.coordinatesDisplay.textContent = `坐标: (${Math.round(
      coords.x
    )}, ${Math.round(coords.y)})`;

    // 绘制中梃时更新指示线
    if (state.isMullionDrawing) {
      state.mullionEndPoint = coords;
      window.updateMullionIndicator();
    }
    // 绘制过程中更新选择框
    else if (state.isDrawing) {
      const currentX = coords.x;
      const currentY = coords.y;

      const left = Math.min(state.startX, currentX);
      const top = Math.min(state.startY, currentY);
      const width = Math.abs(currentX - state.startX);
      const height = Math.abs(currentY - state.startY);

      window.selectionBox.style.left = left + "px";
      window.selectionBox.style.top = top + "px";
      window.selectionBox.style.width = width + "px";
      window.selectionBox.style.height = height + "px";
    }
    // 拖拽移动元素
    else if (state.isDragging && state.selectedElement) {
      const canvasRect = window.designerCanvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - state.elementOffsetX;
      const newY = e.clientY - canvasRect.top - state.elementOffsetY;

      // 更新元素位置（限制在画布内）
      const boundedX = Math.max(
        0,
        Math.min(
          newX,
          canvasRect.width - parseInt(state.selectedElement.style.width)
        )
      );
      const boundedY = Math.max(
        0,
        Math.min(
          newY,
          canvasRect.height - parseInt(state.selectedElement.style.height)
        )
      );

      state.selectedElement.style.left = boundedX + "px";
      state.selectedElement.style.top = boundedY + "px";

      // 更新设计数据
      window.updateElementData(state.selectedElement);
    }
    // 调整元素大小
    else if (state.isResizing && state.selectedElement) {
      const canvasRect = window.designerCanvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      let elementLeft = parseInt(state.selectedElement.style.left) || 0;
      let elementTop = parseInt(state.selectedElement.style.top) || 0;
      let elementWidth = parseInt(state.selectedElement.style.width) || 0;
      let elementHeight = parseInt(state.selectedElement.style.height) || 0;
      const minSize = 20; // 最小尺寸阈值

      // 根据手柄位置调整尺寸
      switch (state.resizeHandle) {
        case "nw":
          const newWidthNW = elementLeft + elementWidth - x;
          const newHeightNW = elementTop + elementHeight - y;
          if (
            newWidthNW > minSize &&
            newHeightNW > minSize &&
            x >= 0 &&
            y >= 0
          ) {
            elementLeft = x;
            elementTop = y;
            elementWidth = newWidthNW;
            elementHeight = newHeightNW;
          }
          break;
        case "n":
          const newHeightN = elementTop + elementHeight - y;
          if (newHeightN > minSize && y >= 0) {
            elementTop = y;
            elementHeight = newHeightN;
          }
          break;
        case "ne":
          const newWidthNE = x - elementLeft;
          const newHeightNE = elementTop + elementHeight - y;
          if (
            newWidthNE > minSize &&
            newHeightNE > minSize &&
            x <= canvasRect.width &&
            y >= 0
          ) {
            elementWidth = newWidthNE;
            elementTop = y;
            elementHeight = newHeightNE;
          }
          break;
        case "e":
          if (x > elementLeft + minSize && x <= canvasRect.width) {
            elementWidth = x - elementLeft;
          }
          break;
        case "se":
          if (
            x > elementLeft + minSize &&
            x <= canvasRect.width &&
            y > elementTop + minSize &&
            y <= canvasRect.height
          ) {
            elementWidth = x - elementLeft;
            elementHeight = y - elementTop;
          }
          break;
        case "s":
          if (y > elementTop + minSize && y <= canvasRect.height) {
            elementHeight = y - elementTop;
          }
          break;
        case "sw":
          const newWidthSW = elementLeft + elementWidth - x;
          if (
            newWidthSW > minSize &&
            x >= 0 &&
            y > elementTop + minSize &&
            y <= canvasRect.height
          ) {
            elementLeft = x;
            elementWidth = newWidthSW;
            elementHeight = y - elementTop;
          }
          break;
        case "w":
          const newWidthW = elementLeft + elementWidth - x;
          if (newWidthW > minSize && x >= 0) {
            elementLeft = x;
            elementWidth = newWidthW;
          }
          break;
      }

      // 更新元素样式
      state.selectedElement.style.left = elementLeft + "px";
      state.selectedElement.style.top = elementTop + "px";
      state.selectedElement.style.width = elementWidth + "px";
      state.selectedElement.style.height = elementHeight + "px";

      // 更新设计数据
      window.updateElementData(state.selectedElement);
    }
  }

  // 鼠标松开事件
  function handleDocumentMouseUp(e) {
    const state = window.appState;
    if (!state) return;

    if (state.isMullionDrawing) {
      state.isMullionDrawing = false;

      // 隐藏指示线
      if (state.mullionIndicator) {
        state.mullionIndicator.style.display = "none";
      }

      // 获取绘制的中梃尺寸
      if (state.mullionStartPoint && state.mullionEndPoint) {
        const width = Math.abs(
          state.mullionEndPoint.x - state.mullionStartPoint.x
        );
        const height = Math.abs(
          state.mullionEndPoint.y - state.mullionStartPoint.y
        );

        // 只有当尺寸足够大时才添加元素
        if (width > 10 || height > 10) {
          // 保存历史记录
          window.saveHistory();

          // 创建新中梃元素
          const left = Math.min(
            state.mullionStartPoint.x,
            state.mullionEndPoint.x
          );
          const top = Math.min(
            state.mullionStartPoint.y,
            state.mullionEndPoint.y
          );

          // 确定中梃方向
          const isHorizontal = width > height;

          const newElement = {
            type: state.currentTool,
            x: left,
            y: top,
            width: isHorizontal ? width : 10,
            height: isHorizontal ? 10 : height,
            isHorizontal: isHorizontal,
          };

          // 添加到画布
          window.addElement(newElement);
        }
      }
    }
    // 处理其他工具的绘制
    else if (state.isDrawing) {
      state.isDrawing = false;

      // 隐藏选择框
      window.selectionBox.style.display = "none";

      // 获取选择框的尺寸
      const left = parseInt(window.selectionBox.style.left) || 0;
      const top = parseInt(window.selectionBox.style.top) || 0;
      const width = parseInt(window.selectionBox.style.width) || 0;
      const height = parseInt(window.selectionBox.style.height) || 0;

      // 只有当尺寸足够大时才添加元素
      if (width > 10 && height > 10) {
        // 保存历史记录
        window.saveHistory();

        // 创建新元素
        const newElement = {
          type: state.currentTool,
          x: left,
          y: top,
          width: width,
          height: height,
        };

        // 添加到画布
        window.addElement(newElement);
      }
    }
    // 停止拖拽
    else if (state.isDragging) {
      state.isDragging = false;
    }
    // 停止调整大小
    else if (state.isResizing) {
      state.isResizing = false;
      state.resizeHandle = null;
    }
  }

  // 初始化由base.js统一控制，不再需要通知主模块
});
