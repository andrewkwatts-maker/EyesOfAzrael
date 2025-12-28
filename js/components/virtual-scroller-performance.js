/**
 * Virtual Scroller Performance Monitor
 *
 * Tracks and analyzes virtual scrolling performance metrics
 * Provides real-time performance insights and optimization recommendations
 */

export class VirtualScrollerPerformance {
    constructor(virtualScroller) {
        this.scroller = virtualScroller;
        this.metrics = {
            renders: [],
            scrollEvents: [],
            fps: [],
            memory: []
        };

        this.enabled = true;
        this.maxSamples = 100; // Keep last 100 samples
        this.warningThreshold = 16; // 60fps = 16.67ms per frame
        this.criticalThreshold = 33; // 30fps = 33.33ms per frame
    }

    /**
     * Track a render event
     */
    trackRender(duration, itemCount, visibleCount) {
        if (!this.enabled) return;

        const renderMetric = {
            timestamp: Date.now(),
            duration: duration,
            itemCount: itemCount,
            visibleCount: visibleCount,
            fps: duration > 0 ? Math.round(1000 / duration) : 60,
            status: this.getPerformanceStatus(duration)
        };

        this.metrics.renders.push(renderMetric);

        // Keep only recent samples
        if (this.metrics.renders.length > this.maxSamples) {
            this.metrics.renders.shift();
        }

        // Track FPS
        this.metrics.fps.push(renderMetric.fps);
        if (this.metrics.fps.length > this.maxSamples) {
            this.metrics.fps.shift();
        }

        // Log warnings
        if (renderMetric.status === 'critical') {
            console.warn(`[VirtualScroller Performance] Critical render time: ${duration.toFixed(2)}ms`);
        } else if (renderMetric.status === 'warning') {
            console.warn(`[VirtualScroller Performance] Slow render: ${duration.toFixed(2)}ms`);
        }

        return renderMetric;
    }

    /**
     * Track a scroll event
     */
    trackScroll(scrollTop, velocity) {
        if (!this.enabled) return;

        const scrollMetric = {
            timestamp: Date.now(),
            scrollTop: scrollTop,
            velocity: velocity || 0
        };

        this.metrics.scrollEvents.push(scrollMetric);

        if (this.metrics.scrollEvents.length > this.maxSamples) {
            this.metrics.scrollEvents.shift();
        }

        return scrollMetric;
    }

    /**
     * Track memory usage (if available)
     */
    trackMemory() {
        if (!this.enabled) return;

        if (performance.memory) {
            const memoryMetric = {
                timestamp: Date.now(),
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };

            this.metrics.memory.push(memoryMetric);

            if (this.metrics.memory.length > this.maxSamples) {
                this.metrics.memory.shift();
            }

            return memoryMetric;
        }

        return null;
    }

    /**
     * Get performance status based on render time
     */
    getPerformanceStatus(duration) {
        if (duration > this.criticalThreshold) {
            return 'critical'; // <30fps
        } else if (duration > this.warningThreshold) {
            return 'warning'; // <60fps
        } else {
            return 'good'; // >=60fps
        }
    }

    /**
     * Get average render time
     */
    getAverageRenderTime() {
        if (this.metrics.renders.length === 0) return 0;

        const sum = this.metrics.renders.reduce((acc, metric) => acc + metric.duration, 0);
        return sum / this.metrics.renders.length;
    }

    /**
     * Get average FPS
     */
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 60;

        const sum = this.metrics.fps.reduce((acc, fps) => acc + fps, 0);
        return Math.round(sum / this.metrics.fps.length);
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const avgRenderTime = this.getAverageRenderTime();
        const avgFPS = this.getAverageFPS();

        const summary = {
            totalRenders: this.metrics.renders.length,
            averageRenderTime: avgRenderTime.toFixed(2),
            averageFPS: avgFPS,
            minFPS: Math.min(...this.metrics.fps),
            maxFPS: Math.max(...this.metrics.fps),
            status: this.getPerformanceStatus(avgRenderTime),
            slowRenders: this.metrics.renders.filter(m => m.status !== 'good').length,
            totalScrollEvents: this.metrics.scrollEvents.length
        };

        // Add memory info if available
        if (this.metrics.memory.length > 0) {
            const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
            summary.memory = {
                used: (latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                total: (latestMemory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                limit: (latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
            };
        }

        return summary;
    }

    /**
     * Get optimization recommendations
     */
    getRecommendations() {
        const avgRenderTime = this.getAverageRenderTime();
        const avgFPS = this.getAverageFPS();
        const recommendations = [];

        if (avgFPS < 30) {
            recommendations.push({
                severity: 'critical',
                message: 'Very low FPS detected. Consider increasing item height or reducing buffer size.',
                action: 'Reduce complexity of rendered items or increase item height'
            });
        } else if (avgFPS < 60) {
            recommendations.push({
                severity: 'warning',
                message: 'FPS below 60. Performance could be improved.',
                action: 'Optimize renderItem function or reduce buffer size'
            });
        }

        if (avgRenderTime > 50) {
            recommendations.push({
                severity: 'critical',
                message: `Render time (${avgRenderTime.toFixed(2)}ms) is very high.`,
                action: 'Simplify item rendering or use lighter DOM operations'
            });
        }

        const recentScrolls = this.metrics.scrollEvents.slice(-10);
        if (recentScrolls.length > 5) {
            const avgVelocity = recentScrolls.reduce((acc, s) => acc + Math.abs(s.velocity || 0), 0) / recentScrolls.length;
            if (avgVelocity > 1000) {
                recommendations.push({
                    severity: 'info',
                    message: 'Fast scrolling detected. Ensure smooth rendering.',
                    action: 'Consider increasing buffer size for smoother fast scrolling'
                });
            }
        }

        if (this.metrics.memory.length > 0) {
            const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
            const usedPercent = (latestMemory.usedJSHeapSize / latestMemory.jsHeapSizeLimit) * 100;

            if (usedPercent > 90) {
                recommendations.push({
                    severity: 'critical',
                    message: `Memory usage at ${usedPercent.toFixed(1)}% of limit.`,
                    action: 'Reduce item count or simplify item rendering'
                });
            } else if (usedPercent > 70) {
                recommendations.push({
                    severity: 'warning',
                    message: `Memory usage at ${usedPercent.toFixed(1)}% of limit.`,
                    action: 'Monitor memory usage and consider optimization'
                });
            }
        }

        if (recommendations.length === 0) {
            recommendations.push({
                severity: 'success',
                message: 'Performance is optimal!',
                action: 'No action needed'
            });
        }

        return recommendations;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const summary = this.getSummary();
        const recommendations = this.getRecommendations();

        const report = {
            timestamp: new Date().toISOString(),
            summary: summary,
            recommendations: recommendations,
            metrics: {
                renderTimes: this.metrics.renders.map(r => r.duration),
                fps: this.metrics.fps,
                scrollCount: this.metrics.scrollEvents.length
            }
        };

        console.log('[VirtualScroller Performance Report]', report);

        return report;
    }

    /**
     * Display performance overlay on page
     */
    showOverlay(container) {
        const summary = this.getSummary();
        const recommendations = this.getRecommendations();

        const overlay = document.createElement('div');
        overlay.className = 'virtual-scroller-performance-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            padding: 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const statusColor = summary.status === 'good' ? '#0f0' :
                           summary.status === 'warning' ? '#ff0' : '#f00';

        overlay.innerHTML = `
            <div style="margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">
                <strong style="color: ${statusColor}; font-size: 14px;">Virtual Scroller Performance</strong>
            </div>
            <div style="margin-bottom: 8px;">
                <div>Avg Render: <strong>${summary.averageRenderTime}ms</strong></div>
                <div>Avg FPS: <strong>${summary.averageFPS}</strong></div>
                <div>Total Renders: <strong>${summary.totalRenders}</strong></div>
                <div>Slow Renders: <strong style="color: ${summary.slowRenders > 0 ? '#ff0' : '#0f0'}">${summary.slowRenders}</strong></div>
            </div>
            ${summary.memory ? `
                <div style="margin-bottom: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <div style="color: #888; font-size: 11px; margin-bottom: 4px;">Memory:</div>
                    <div>Used: <strong>${summary.memory.used}</strong></div>
                    <div>Total: <strong>${summary.memory.total}</strong></div>
                </div>
            ` : ''}
            <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                <div style="color: #888; font-size: 11px; margin-bottom: 4px;">Recommendations:</div>
                ${recommendations.map(rec => {
                    const recColor = rec.severity === 'critical' ? '#f00' :
                                   rec.severity === 'warning' ? '#ff0' :
                                   rec.severity === 'success' ? '#0f0' : '#0ff';
                    return `<div style="color: ${recColor}; margin-bottom: 4px;">• ${rec.message}</div>`;
                }).join('')}
            </div>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 8px;
                width: 100%;
                padding: 6px;
                background: #333;
                color: #fff;
                border: 1px solid #666;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            ">Close</button>
        `;

        (container || document.body).appendChild(overlay);

        return overlay;
    }

    /**
     * Enable performance tracking
     */
    enable() {
        this.enabled = true;
        console.log('[VirtualScroller Performance] Tracking enabled');
    }

    /**
     * Disable performance tracking
     */
    disable() {
        this.enabled = false;
        console.log('[VirtualScroller Performance] Tracking disabled');
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            renders: [],
            scrollEvents: [],
            fps: [],
            memory: []
        };
        console.log('[VirtualScroller Performance] Metrics reset');
    }
}

// ES Module export
export default VirtualScrollerPerformance;

// Global export
if (typeof window !== 'undefined') {
    window.VirtualScrollerPerformance = VirtualScrollerPerformance;
}
