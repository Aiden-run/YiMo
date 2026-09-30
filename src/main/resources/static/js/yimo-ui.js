/**
 * YiMo UI Components - 自定义 Vue2 组件库
 * 替换 Element UI，提供 ym-* 组件 + $message/$confirm 兼容层
 */
(function (window) {
    var Vue = window.Vue;

    // ==================== SVG 图标字典 ====================
    var Icons = {
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        stream: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 13 10 19 10 11 22 11 14 5 14 13 2"/></svg>',
        loader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
        moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
        swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.28 6.88.74-5.13 4.64 1.34 6.84L12 17.6l-6.04 3.4 1.34-6.84-5.13-4.64 6.88-.74z"/></svg>'
    };

    // ==================== ym-icon 组件 ====================
    Vue.component('ym-icon', {
        props: {name: String, size: {type: String, default: '16'}},
        computed: {
            svg: function () {
                return Icons[this.name] || '';
            }
        },
        template: '<span class="ym-icon" :style="{width: size+\'px\', height: size+\'px\'}" v-html="svg"></span>'
    });

    // ==================== ym-btn 组件 ====================
    Vue.component('ym-btn', {
        props: {
            type: {type: String, default: 'default'},
            size: {type: String, default: ''},
            icon: String,
            disabled: Boolean
        },
        computed: {
            cls: function () {
                var c = 'ym-btn ym-btn--' + this.type;
                if (this.size) c += ' ym-btn--' + this.size;
                if (this.disabled) c += ' is-disabled';
                return c;
            }
        },
        template: '<button type="button" :class="cls" :disabled="disabled" @click="$emit(\'click\')"><ym-icon v-if="icon" :name="icon" size="14"></ym-icon><span v-if="$slots.default" class="ym-btn__text"><slot></slot></span></button>'
    });

    // ==================== ym-form + ym-form-item ====================
    Vue.component('ym-form', {
        props: {model: Object, rules: Object, labelWidth: {type: String, default: '80px'}},
        data: function () {
            return {errors: {}};
        },
        provide: function () {
            return {ymForm: this};
        },
        methods: {
            validate: function (cb) {
                var self = this;
                return new Promise(function (resolve, reject) {
                    var errors = {};
                    if (self.rules) {
                        for (var field in self.rules) {
                            var rules = self.rules[field];
                            var val = self.model ? self.model[field] : undefined;
                            for (var i = 0; i < rules.length; i++) {
                                var rule = rules[i];
                                if (rule.required && (val === '' || val == null || val === undefined)) {
                                    errors[field] = rule.message;
                                    break;
                                }
                            }
                        }
                    }
                    self.errors = errors;
                    var valid = Object.keys(errors).length === 0;
                    if (typeof cb === 'function') cb(valid);
                    valid ? resolve(true) : reject(errors);
                });
            },
            resetFields: function () {
                this.errors = {};
            }
        },
        template: '<form class="ym-form" @submit.prevent><slot></slot></form>'
    });

    Vue.component('ym-form-item', {
        props: {label: String, prop: String},
        inject: ['ymForm'],
        computed: {
            error: function () {
                return this.prop && this.ymForm ? this.ymForm.errors[this.prop] : '';
            }
        },
        template: '<div class="ym-form-item" :class="{\'has-error\': error}"><label class="ym-form-item__label" v-if="label">{{ label }}</label><div class="ym-form-item__content"><slot></slot><div class="ym-form-item__error" v-if="error">{{ error }}</div></div></div>'
    });

    // ==================== ym-modal 组件 ====================
    Vue.component('ym-modal', {
        props: {
            title: String,
            visible: Boolean,
            width: {type: String, default: '600px'}
        },
        watch: {
            visible: function (val) {
                if (val) {
                    document.body.style.overflow = 'hidden';
                    var self = this;
                    this._escHandler = function (e) {
                        if (e.key === 'Escape') self.$emit('update:visible', false);
                    };
                    document.addEventListener('keydown', this._escHandler);
                } else {
                    document.body.style.overflow = '';
                    if (this._escHandler) {
                        document.removeEventListener('keydown', this._escHandler);
                        this._escHandler = null;
                    }
                }
            }
        },
        template: '<transition name="ym-modal"><div class="ym-modal" v-if="visible"><div class="ym-modal__overlay" @click="$emit(\'update:visible\', false)"></div><div class="ym-modal__dialog" :style="{width: width}"><div class="ym-modal__header"><h3 class="ym-modal__title">{{ title }}</h3><button class="ym-modal__close" @click="$emit(\'update:visible\', false)"><ym-icon name="x" size="18"></ym-icon></button></div><div class="ym-modal__body"><slot></slot></div><div class="ym-modal__footer" v-if="$slots.footer"><slot name="footer"></slot></div></div></div></transition>'
    });

    // ==================== ym-pagination 组件 ====================
    Vue.component('ym-pagination', {
        props: {
            currentPage: Number,
            pageSize: Number,
            total: Number
        },
        computed: {
            totalPages: function () {
                return Math.ceil(this.total / this.pageSize) || 1;
            },
            pages: function () {
                var tp = this.totalPages;
                var cp = this.currentPage;
                var arr = [];
                if (tp <= 7) {
                    for (var i = 1; i <= tp; i++) arr.push(i);
                } else {
                    arr.push(1);
                    if (cp > 3) arr.push('...');
                    var start = Math.max(2, cp - 1);
                    var end = Math.min(tp - 1, cp + 1);
                    for (var j = start; j <= end; j++) arr.push(j);
                    if (cp < tp - 2) arr.push('...');
                    arr.push(tp);
                }
                return arr;
            }
        },
        methods: {
            go: function (p) {
                if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
                    this.$emit('current-change', p);
                }
            }
        },
        template: '<div class="ym-pagination" v-if="total > 0"><span class="ym-pagination__total">共 {{ total }} 条</span><button class="ym-pagination__btn" :disabled="currentPage <= 1" @click="go(currentPage - 1)"><ym-icon name="chevronLeft" size="14"></ym-icon></button><button v-for="p in pages" :key="p" :class="[\'ym-pagination__btn\', {\'is-active\': p === currentPage, \'is-dots\': p === \'...\'}]" :disabled="p === \'...\'" @click="typeof p === \'number\' && go(p)"><span>{{ p }}</span></button><button class="ym-pagination__btn" :disabled="currentPage >= totalPages" @click="go(currentPage + 1)"><ym-icon name="chevronRight" size="14"></ym-icon></button></div>'
    });

    // ==================== Toast 系统 ====================
    var YiMoToast = {
        container: null,
        items: [],
        _init: function () {
            if (this.container) return;
            this.container = document.createElement('div');
            this.container.className = 'ym-toast-container';
            document.body.appendChild(this.container);
        },
        show: function (message, type, duration) {
            this._init();
            type = type || 'info';
            duration = duration || 3000;
            var icons = {success: 'check', error: 'x', warning: 'x', info: 'x'};
            var el = document.createElement('div');
            el.className = 'ym-toast ym-toast--' + type;
            el.innerHTML = '<ym-icon-span>' + (Icons[icons[type]] || Icons.x) + '</ym-icon-span><span class="ym-toast__msg">' + message + '</span>';
            this.container.appendChild(el);
            // 触发入场动画
            setTimeout(function () {
                el.classList.add('ym-toast--show');
            }, 10);
            // 自动消失
            var self = this;
            setTimeout(function () {
                el.classList.remove('ym-toast--show');
                setTimeout(function () {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 300);
            }, duration);
        }
    };
    window.YiMoToast = YiMoToast;

    // ==================== Confirm 系统 ====================
    var YiMoConfirm = {
        show: function (opts) {
            var overlay = document.createElement('div');
            overlay.className = 'ym-confirm-overlay';
            var typeIcon = {warning: '!', error: 'x', info: 'i', success: 'check'};
            var typeColor = {warning: '#d29922', error: '#f85149', info: '#2f81f7', success: '#3fb950'};
            var t = opts.type || 'info';
            overlay.innerHTML =
                '<div class="ym-confirm">' +
                '<div class="ym-confirm__header">' +
                '<div class="ym-confirm__icon" style="color:' + (typeColor[t] || typeColor.info) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
                '</div>' +
                '<h3 class="ym-confirm__title">' + (opts.title || '提示') + '</h3>' +
                '</div>' +
                '<p class="ym-confirm__msg">' + opts.message + '</p>' +
                '<div class="ym-confirm__footer">' +
                '<button class="ym-btn ym-btn--default ym-btn--sm ym-confirm__cancel">' + (opts.cancelText || '取消') + '</button>' +
                '<button class="ym-btn ym-btn--' + (t === 'warning' || t === 'error' ? 'danger' : 'primary') + ' ym-btn--sm ym-confirm__ok">' + (opts.confirmText || '确定') + '</button>' +
                '</div></div>';
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            setTimeout(function () {
                overlay.classList.add('ym-confirm--show');
            }, 10);

            function close() {
                overlay.classList.remove('ym-confirm--show');
                document.body.style.overflow = '';
                setTimeout(function () {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 200);
            }

            function onEsc(e) {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', onEsc);
                    if (opts.onCancel) opts.onCancel();
                }
            }

            document.addEventListener('keydown', onEsc);
            overlay.querySelector('.ym-confirm__cancel').addEventListener('click', function () {
                close();
                document.removeEventListener('keydown', onEsc);
                if (opts.onCancel) opts.onCancel();
            });
            overlay.querySelector('.ym-confirm__ok').addEventListener('click', function () {
                close();
                document.removeEventListener('keydown', onEsc);
                if (opts.onConfirm) opts.onConfirm();
            });
            overlay.querySelector('.ym-confirm__overlay') || overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    close();
                    document.removeEventListener('keydown', onEsc);
                    if (opts.onCancel) opts.onCancel();
                }
            });
        }
    };
    window.YiMoConfirm = YiMoConfirm;

    // ==================== Vue.prototype 兼容层 ====================
    Vue.prototype.$message = function (opts) {
        if (typeof opts === 'string') return YiMoToast.show(opts, 'info');
        return YiMoToast.show(opts.message, opts.type || 'info');
    };
    ['success', 'error', 'warning', 'info'].forEach(function (t) {
        Vue.prototype.$message[t] = function (msg) {
            YiMoToast.show(msg, t);
        };
    });

    Vue.prototype.$confirm = function (message, title, options) {
        if (typeof title === 'object' && !options) {
            options = title;
            title = '提示';
        }
        title = title || '提示';
        options = options || {};
        return new Promise(function (resolve, reject) {
            YiMoConfirm.show({
                message: message,
                title: title,
                type: options.type || 'warning',
                confirmText: options.confirmButtonText || '确定',
                cancelText: options.cancelButtonText || '取消',
                onConfirm: function () {
                    resolve('confirm');
                },
                onCancel: function () {
                    reject('cancel');
                }
            });
        });
    };
})(window);
