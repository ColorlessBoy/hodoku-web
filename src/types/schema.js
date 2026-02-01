/**
 * @typedef {Object} CellColor
 * @property {string} [background] - 背景颜色 (Hex/RGBA)
 * @property {string} [digit] - 数字颜色
 * @property {Object.<number, string>} [candidates] - 特定候选数的颜色 { candidate: color }
 */

/**
 * @typedef {Object} Cell
 * @property {number} row - 行索引 (0-8)
 * @property {number} col - 列索引 (0-8)
 * @property {number|null} value - 填入的数字 (1-9)，为空则为 null
 * @property {boolean} [isGiven] - 是否为初始题面数字 (不可修改)
 * @property {number[]} [candidates] - 候选数列表
 * @property {CellColor} [colors] - 单元格相关的颜色配置
 */

/**
 * @typedef {Object} LinkNode
 * @property {number} row
 * @property {number} col
 * @property {number} digit - 涉及的数字
 */

/**
 * @typedef {Object} Link
 * @property {LinkNode} start - 起点
 * @property {LinkNode} end - 终点
 * @property {'strong'|'weak'} type - 链类型 (强链/弱链)
 * @property {string} [color] - 链的颜色
 */

/**
 * @typedef {Object} SudokuState
 * @property {Cell[]} cells - 81个单元格的数据 (按行优先排序)
 * @property {Link[]} [links] - 逻辑链
 * @property {Object[]} [regions] - 区域定义 (默认标准数独可省略)
 */

export const SchemaDocs = {}; // Dummy export to make it a module
