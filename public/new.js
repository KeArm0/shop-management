
  async function order() {
    //查询当前页面的数据状态
    const nowshoppage=getCurrentPageData()
   //查询同一个orderid下的所有cargoid
    const cargoArr=await queryCargo(1)
    console.log(nowshoppage)
    console.log(cargoArr)
}

