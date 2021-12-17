const api_path = 'skps0102';
const url = `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}`;
let folder = {
    products: 'products',
    carts: 'carts',
    orders: 'orders'
};
const token = '3n8fn9LuHPYu9Ex9kzFbar6jqLE2';
const params = {
    headers: {
        authorization: token
    }
};

init();

function init(){
    getOrderData();
}

function getOrderData(){
    axios.get(`${url}/${folder.orders}`,params)
    .then(function (response) {
        //取得訂單資料
        const orderData = response.data.orders;
        console.log(orderData);
        //渲染訂單列表
        renderOrderList(orderData);
        //渲染C3
        renderC3(orderData);
        //加入所有監聽
        addEventHandle();
    })
    .catch(function (error) {
        //console.log(error);
    })
}

function renderOrderList(orderData){
    console.log('renderOrderList');
    const orderPageTable = document.querySelector('.orderPage-table');
    let str = `<thead>
                <tr>
                <th>訂單編號</th>
                <th>聯絡人</th>
                <th>聯絡地址</th>
                <th>電子郵件</th>
                <th>訂單品項</th>
                <th>訂單日期</th>
                <th>訂單狀態</th>
                <th>操作</th>
                </tr>
            </thead>`;
            //<tr>目前沒有訂單</tr>
    if(orderData.length === 0){
        str += '<tr>目前沒有訂單</tr>';
    }else{
        orderData.forEach(item => {
            //console.log(item);
            const timestamp = parseInt(item.createdAt + '000');
            const date = new Date(timestamp);
            const orderDate = `${date.getFullYear()}/${(date.getMonth()+1)}/${date.getDate()}`;
    
            let titleStr = '';
            item.products.forEach(item => {
                titleStr += `${item.title}<br>`
            })
            
            const orderStatus = item.paid !== true?'未處理':'已處理';
    
            str += `<tr>
                        <td>${item.id}</td>
                        <td>
                            <p>${item.user.name}</p>
                            <p>${item.user.tel}</p>
                        </td>
                        <td>${item.user.address}</td>
                        <td>${item.user.email}</td>
                        <td>
                            <p>${titleStr}</p>
                        </td>
                        <td>${orderDate}</td>
                        <td>
                            <a href="#" class="orderStatus" data-id="${item.id}" data-paid="${item.paid}">${orderStatus}</a>
                        </td>
                        <td>
                            <input type="button" class="delSingleOrder-Btn" value="刪除" data-id="${item.id}">
                        </td>
                    </tr>`;
        })
    }
    orderPageTable.innerHTML = str;
}

function renderC3(orderData){
    console.log('renderC3');
    if(orderData.length === 0) return;
    //做全品項營收比重，類別含四項，篩選出前三名營收品項，其他 4~8 名都統整為「其它」
    const titleCount = {};
    const categoryCount = {};
    orderData.forEach(item => {
        item.products.forEach(item => {
            if(titleCount[item.title] === undefined){
                titleCount[item.title] = 1;
            }else{
                titleCount[item.title] += 1;
            }

            if(categoryCount[item.category] === undefined){
                categoryCount[item.category] = 1;
            }else{
                categoryCount[item.category] += 1;
            }
        })
    })
    console.log(categoryCount);
    const titleCountArryData = Object.entries(titleCount);
    console.log(titleCountArryData);
    const sortData = titleCountArryData.sort(function(a, b) {return a[1] - b[1];});
    const c3_titleCountColumnsData = [];
    let otherCount = 0;
    
    sortData.reverse().forEach((item,index) => {
        if(index < 3){
            c3_titleCountColumnsData.push(item);
        }else{
            otherCount += item[1];
        } 
    })
    c3_titleCountColumnsData.push(["其他",otherCount]);

    const chart1_Colors = {};
    chart1_Colors[c3_titleCountColumnsData[0][0]] = '#DACBFF';
    chart1_Colors[c3_titleCountColumnsData[1][0]] = '#9D7FEA';
    chart1_Colors[c3_titleCountColumnsData[2][0]] = '#5434A7';
    chart1_Colors[c3_titleCountColumnsData[3][0]] = '#301E5F';

    // C3.js
    let chart1 = c3.generate({
        bindto: '#chart1', // HTML 元素綁定
        data: {
            type: "pie",
            columns: c3_titleCountColumnsData,
            colors: chart1_Colors
        },
    });

    const c3_categoryCountColumnsData = Object.entries(categoryCount);
    console.log(c3_categoryCountColumnsData);

    const color = ['#DACBFF','#9D7FEA','#5434A7'];
    const chart2_Colors = {};
    c3_categoryCountColumnsData.forEach((item,index) => {
        console.log(item);
        chart2_Colors[item[0]] = color[index];
    })

    console.log('chart2_Colors',chart2_Colors);

    let chart2 = c3.generate({
        bindto: '#chart2', // HTML 元素綁定
        data: {
            type: "pie",
            columns: c3_categoryCountColumnsData,
            colors: chart2_Colors
        },
    });
}

function modifyOrderStatus(id,paid){
    //console.log(id,paid);
    const payloadData = {
        data: {
            id,
            paid
        }
    };
    axios.put(`${url}/${folder.orders}`,payloadData,params)
    .then(function(response){
        //console.log(response);
        const orderData = response.data.orders;
        //從新render畫面
        renderOrderList(orderData)
    })
    .catch(function (error) {
        //console.log(error);
    })
}

function deleteOrderSingle(id){
    axios.delete(`${url}/${folder.orders}/${id}`,params)
    .then(function(response){
        //console.log(response);
        const orderData = response.data.orders;
        renderC3(orderData);
        renderOrderList(orderData);
    })
    .catch(function (error) {
        //console.log(error);
    })
}

function deleteOrderAll(){
    axios.delete(`${url}/${folder.orders}`,params)
    .then(function(response){
        //console.log(response);
        const orderData = response.data.orders;
        renderC3(orderData);
        renderOrderList(orderData);
    })
    .catch(function (error) {
        const errorResp = error.response;
        //console.log(errorResp);
        if(errorResp.status === 400){
            swal("錯誤", "目前沒有任何訂單!", "error");
        }
    })
}

function addEventHandle(){
    console.log('addEventHandle');
    const orderPageList = document.querySelector('.orderPage-list');
    orderPageList.addEventListener('click',function(e){
        e.preventDefault();
        console.log('click');
        const node = e.target.nodeName;
        if(node !== 'A' && node !== 'INPUT') return;
        if(e.target.className === 'discardAllBtn'){
            console.log('刪除全部');
            deleteOrderAll();
            return;
        }
        if(e.target.className === 'delSingleOrder-Btn'){
            console.log('刪除單一個');
            const id = e.target.dataset.id;
            deleteOrderSingle(id);
            return;
        }
        if(e.target.className === 'orderStatus'){
            console.log('更改狀態');
            const id = e.target.dataset.id;
            let paid = e.target.dataset.paid;
            if(paid === 'true') {
                paid = false;
            }else{
                paid = true;
            }
            modifyOrderStatus(id,paid);
            return;
        }
    })
}