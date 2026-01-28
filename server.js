const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 获取分页数据
app.get('/api/shop', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 获取数据
        const [rows] = await db.query(
            'SELECT * FROM shop ORDER BY oderid LIMIT ? OFFSET ?',
            [limit, offset]
        );

        // 获取总数
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM shop');
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('查询失败:', error);
        res.status(500).json({
            success: false,
            message: '查询数据失败'
        });
    }
});

// 批量操作选中的数据
app.post('/api/shop/batch-action', async (req, res) => {
    try {
        const { ids, action } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请选择要操作的数据'
            });
        }

        // 这里可以根据不同的action执行不同的操作
        // 例如：删除、导出、状态更新等
        console.log(`执行操作 ${action}，选中的ID:`, ids);

        res.json({
            success: true,
            message: `成功对 ${ids.length} 条数据执行 ${action} 操作`
        });
    } catch (error) {
        console.error('批量操作失败:', error);
        res.status(500).json({
            success: false,
            message: '批量操作失败'
        });
    }
});

// 根据orderid查询cargoid数组
app.get('/api/shop/cargo/:orderid', async (req, res) => {
    try {
        const orderid = parseInt(req.params.orderid);
        
        if (!orderid || isNaN(orderid)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的订单ID'
            });
        }

        // 查询该orderid对应的所有cargoid
        const [rows] = await db.query(
            'SELECT cargoid FROM shop WHERE oderid = ?',
            [orderid]
        );

        // 提取cargoid数组
        const cargoids = rows.map(row => row.cargoid).filter(id => id !== null);

        res.json({
            success: true,
            data: {
                orderid: orderid,
                cargoids: cargoids,
                count: cargoids.length
            }
        });
    } catch (error) {
        console.error('查询失败:', error);
        res.status(500).json({
            success: false,
            message: '查询数据失败'
        });
    }
});

// 服务静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});