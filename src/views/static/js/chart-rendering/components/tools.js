function addTariffChartTools(categories){
  let tariffAvgTypeSelect = document.getElementById('avg-type-select')
  let categorySelect = document.getElementById('category-select')

  categories.forEach(category => {
    let option = document.createElement("option");
    option.text = category;
    option.value = category;
    categorySelect.appendChild(option)
  })
  return tariffAvgTypeSelect, categorySelect
}