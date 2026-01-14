import Matter from 'matter-js';
import { config } from './config.js';

/**
 * Класс для визуализации точек пути в игре Plinko
 */
class PathRenderer {
    /**
     * Конструктор класса PathRenderer
     * @param {Object} gameInstance - Экземпляр основного класса игры
     * @param {Object} engineWorld - Мир физического движка Matter.js
     * @param {Object} pathManager - Менеджер путей движения balls
     */
    constructor(gameInstance, engineWorld, pathManager) {
        this.game = gameInstance;
        this.world = engineWorld;
        this.pathManager = pathManager;
        this.visible = false;
        this.pointLabels = [];

        
        this.showPathNumbers = config.showPathNumbers || this.getShowPathsFromURL(); 
    }

    /**
     * Инициализирует рендерер путей
     */
    initialize() {
        
        if (this.showPathNumbers) {
            this.showPathPoints();
        }
    }

    /**
     * Показывает все точки путей на экране
     */
    showPathPoints() {
        if (this.visible) return;

        this.visible = true;

        console.debug("Displaying path point numbers...");


        
        for (const point of this.pathManager.startPoints) {
            this.addPointLabel(point);
        }

        
        for (const row of this.pathManager.pathPoints) {
            for (const point of row) {
                this.addPointLabel(point);
            }
        }

        
        for (const point of this.pathManager.endPoints) {
            this.addPointLabel(point);
        }

        console.debug(`Displayed ${this.pointLabels.length} path points`);
    }

    /**
     * Скрывает все точки путей
     */
    hidePathPoints() {
        if (!this.visible) return;
        this.visible = false;

        
        for (const label of this.pointLabels) {
            if (label && label.parentNode) {
                label.parentNode.removeChild(label);
            }
        }

        this.pointLabels = [];
        console.debug("Path point numbers hidden");
    }

    /**
     * Добавляет метку с номером для точки пути
     * @param {Object} point - Точка пути
     */
    addPointLabel(point) {
        
        const canvas = this.game.render.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = this.game.container.getBoundingClientRect();

        
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        
        const offsetX = (canvasRect.left - containerRect.left);
        const offsetY = (canvasRect.top - containerRect.top);

        
        const labelElement = document.createElement('div');
        
        labelElement.textContent = point.number || '';

        
        let className = 'path-point-label';
        if (point.number && point.number.startsWith('S')) {
            className += ' path-point-label--start';
        } else if (point.number && point.number.startsWith('E')) {
            className += ' path-point-label--end';
        } else if (point.number && point.number.startsWith('4-')) {
            className += ' path-point-label--row4';
        }
        labelElement.className = className;

        
        labelElement.style.left = `${offsetX + (point.x / scaleX)}px`;
        labelElement.style.top = `${offsetY + (point.y / scaleY)}px`;

        
        this.game.container.appendChild(labelElement);

        
        this.pointLabels.push(labelElement);
    }

    /**
     * Обновляет позиции меток при изменении размеров окна
     */
    updateLabelsPositions() {
        if (!this.visible) return;

        
        this.hidePathPoints();

        
        this.showPathPoints();
    }

    /**
     * Переключает видимость точек пути
     */
    togglePathPoints() {
        if (this.visible) {
            this.hidePathPoints();
        } else {
            this.showPathPoints();
        }
    }

    /**
     * Обновляет настройки отображения
     * @param {boolean} showNumbers - Показывать ли номера точек
     */
    updateSettings(showNumbers) {
        this.showPathNumbers = showNumbers;

        if (this.showPathNumbers !== this.visible) {
            this.togglePathPoints();
        }
    }

    /**
     * Обновляет рендерер при изменении размеров игры
     */
    updateDimensions() {
        this.updateLabelsPositions();
    }

    /**
     * Получает настройку показа путей из URL параметров
     */
    getShowPathsFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('showPaths') === 'true';
    }

    /**
     * Очищает ресурсы класса при уничтожении
     */
    cleanup() {
        this.hidePathPoints();
    }
}

export default PathRenderer;
