
  function totQua() {
    var name = document.getElementById('labelname3')
    var quant = document.getElementById('qua')
    if (quant.value == "") {
      quant.style.border = 'solid red 1px'
      return false
    } else {
      quant.style.border = 'solid grey 1px'
      return true
    }
  }
  function imgVal() {
    var name = document.getElementById('img')
    if (name.value == "") {
      name.style.border = 'solid red 1px'
      return false;
    } else {
      name.style.border = 'solid grey 1px'
      return true;
    }
  }
  function cateVal() {
    var name = document.getElementById('labelname2')
    var description = document.getElementById('des')

    if (description.value == "") {
      description.style.border = 'solid red 2px'
      return false
    } else {
      description.style.border = "solid grey 1px"
      return true;
    }
  }
  function nameEval() {
    var name = document.getElementById('nameId')

    if (name.value == "") {
      name.style.border = 'solid red 3px'
      document.getElementById('labelname').innerHTML = '*Enter Product Name'
      document.getElementById('labelname').style.color = 'red'
      return false
    } else {
      name.style.border = 'soild grey 1px'
      document.getElementById('labelname').innerHTML = 'Product Name'
      document.getElementById('labelname').style.color = 'white'
      return true
    }
  }

  function desVal() {
    var label = document.getElementById('labelname1')
    var description = document.getElementById('exampleInputPassword1')

    if (description.value == "") {
      description.style.border = 'solid red 2px'
      label.innerHTML = "*Enter the details"
      label.style.color = 'red'
      return false
    } else {
      description.style.border = "solid grey 1px"
      label.innerHTML = "Details"
      label.style.color = 'white'
      return true;
    }
  }

  function submission() {
    if (!nameEval() || !desVal() || !cateVal() || !imgVal() || !totQua()) {
      return false;
    }
  }