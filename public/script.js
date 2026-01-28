let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
let selectedItems = new Set();

// 页面加载时加载数据
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// 加载数据
async function loadData(page = 1) {
    try {
        showLoading();
        
        const response = await fetch(`/api/shop?page=${page}&limit=5`);
        const result = await response.json();
        
        if (result.success) {
            renderTable(result.data);
            updatePagination(result.pagination);
        } else {
            showMessage('错误', '加载数据失败: ' + result.message);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showMessage('错误', '加载数据失败，请检查网络连接');
    } finally {
        hideLoading();
    }
}


/**
 * 查询同一个orderid下的所有cargoid
 * @param {*} orderid 
 * @returns 
 */
async function queryCargo(orderid) {
    try {
        // 验证参数
        const id = parseInt(orderid);
        if (!id || isNaN(id)) {
            console.error('无效的订单ID:', orderid);
            return [];
        }

        console.log(`正在查询订单 ${id} 的货物数据...`);
        
        const response = await fetch(`/api/shop/cargo/${id}`);
        const result = await response.json();
        
        if (result.success) {
            // console.log(`订单 ${id} 的货物ID:`, result.data.cargoids);
            return result.data.cargoids;
        } else {
            console.error('查询失败:', result.message);
            return [];
        }
    } catch (error) {
        console.error('查询cargo失败:', error);
        return [];
    }
}
/**
 * 获取当前页面数据
 * @returns 
 */
function getCurrentPageData() {
    const rows = document.querySelectorAll('#tableBody tr');
    const currentPageData = [];
    
    rows.forEach(row => {
        // 获取行数据
        const cells = row.querySelectorAll('td');
        
        // 跳过隐藏的行（如果使用了搜索过滤）
        if (row.style.display === 'none') {
            return;
        }
        
        const oderid = parseInt(cells[1].textContent);
        const cargoid = cells[2].textContent ? parseInt(cells[2].textContent) : null;
        const checkbox = cells[0].querySelector('input[type="checkbox"]');
        const isSelected = checkbox ? checkbox.checked : false;
        
        currentPageData.push({
            oderid: oderid,
            cargoid: cargoid,
            selected: isSelected,
            // 如果需要原始对象，可以根据oderid从全局数据中查找
            // rawData: findRawData(oderid)
        });
    });
    
    return currentPageData;
}

// 渲染表格数据
function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        document.getElementById('noData').style.display = 'block';
        return;
    }
    
    document.getElementById('noData').style.display = 'none';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        const isSelected = selectedItems.has(item.oderid);
        
        if (isSelected) {
            row.classList.add('selected');
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       onclick="toggleSelection(${item.oderid}, this)"
                       ${isSelected ? 'checked' : ''}>
            </td>
            <td>${item.oderid || '-'}</td>
            <td>${item.cargoid || '-'}</td>
            <td>
                <button class="btn btn-secondary" onclick="editItem(${item.oderid})">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    updateSelectedInfo();
    updateSelectAllCheckbox();
}

// 更新分页信息
function updatePagination(pagination) {
    currentPage = pagination.page;
    totalPages = pagination.totalPages;
    totalItems = pagination.total;
    
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('totalItems').textContent = totalItems;
    
    // 更新按钮状态
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

// 切换页面
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadData(page);
}

// 刷新数据
function refreshData() {
    selectedItems.clear();
    loadData(currentPage);
}

// 搜索数据
function searchData() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// 切换选中状态
function toggleSelection(id, checkbox) {
    const row = checkbox.closest('tr');
    
    if (checkbox.checked) {
        selectedItems.add(id);
        row.classList.add('selected');
    } else {
        selectedItems.delete(id);
        row.classList.remove('selected');
    }
    
    updateSelectedInfo();
    updateSelectAllCheckbox();
}

// 全选/取消全选
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
    
    if (checkbox.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            const rowId = parseInt(cb.closest('tr').cells[1].textContent);
            if (rowId) selectedItems.add(rowId);
        });
    } else {
        checkboxes.forEach(cb => {
            cb.checked = false;
            const rowId = parseInt(cb.closest('tr').cells[1].textContent);
            if (rowId) selectedItems.delete(rowId);
        });
    }
    
    updateSelectedInfo();
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
    const selectAll = document.getElementById('selectAll');
    
    if (checkboxes.length === 0) {
        selectAll.checked = false;
        return;
    }
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    
    selectAll.checked = allChecked;
    selectAll.indeterminate = anyChecked && !allChecked;
}

// 更新选中信息
function updateSelectedInfo() {
    const selectedInfo = document.getElementById('selectedInfo');
    const selectedCount = document.getElementById('selectedCount');
    
    selectedCount.textContent = selectedItems.size;
    
    if (selectedItems.size > 0) {
        selectedInfo.style.display = 'flex';
    } else {
        selectedInfo.style.display = 'none';
    }
}

// 导出选中数据
async function exportSelected() {
    if (selectedItems.size === 0) {
        showMessage('提示', '请先选择要导出的数据');
        return;
    }
    
    try {
        const response = await fetch('/api/shop/batch-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedItems),
                action: 'export'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 这里可以添加实际的导出逻辑
            // 例如：生成CSV文件或Excel文件
            showMessage('成功', `即将导出 ${selectedItems.size} 条数据`);
        } else {
            showMessage('错误', result.message);
        }
    } catch (error) {
        console.error('导出失败:', error);
        showMessage('错误', '导出失败');
    }
}

// 删除选中数据
async function deleteSelected() {
    if (selectedItems.size === 0) {
        showMessage('提示', '请先选择要删除的数据');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedItems.size} 条数据吗？`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/shop/batch-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedItems),
                action: 'delete'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('成功', result.message);
            // 刷新数据
            setTimeout(() => {
                selectedItems.clear();
                loadData(currentPage);
            }, 1000);
        } else {
            showMessage('错误', result.message);
        }
    } catch (error) {
        console.error('删除失败:', error);
        showMessage('错误', '删除失败');
    }
}

// 编辑项目
function editItem(id) {
    showMessage('编辑', `编辑订单 ID: ${id} - 此功能待实现`);
}

// 显示/隐藏加载动画
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 显示消息模态框
function showMessage(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('messageModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}