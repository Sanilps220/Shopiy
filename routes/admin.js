var express = require('express');
const { response } = require('../app');
var router = express.Router();
var fs = require('fs')
var productHelpers = require('../Helpers/product-helpers')
var adminHelpers = require('../Helpers/admin-helpers')
var userHelpers = require('../Helpers/user-helpers')
const admin={
  name:"admin",
  pass:123
}

const verifyLogin=(req,res,next)=>{
  //let admin = adminHelpers.verify()
  if(req.session.admin ){
    next();
    }else{
      res.render('admin/login-page',{ad:true})
    }
}
 
/* GET users listing. */
router.get('/', verifyLogin,async function(req, res, next) {
  var admin =req.session.admin
  let users = await adminHelpers.getCount()
  let active = await adminHelpers.getActiveCount()
  let products = await adminHelpers.getProductCount()
  let order = await adminHelpers.getOrderCount()
  let topwear = await adminHelpers.getItemsCount("Top wear black")
  let shirt = await adminHelpers.getItemsCount("Strack")
  let men =await adminHelpers.getGendCount("Men")
  let women =await adminHelpers.getGendCount("Women")
  let stockOut = await adminHelpers.getStockOut()
  console.log(users);
  res.render('admin/dashboard',{admin,users,active,products,order,topwear,men,women,shirt,stockOut})
});


router.post('/login',(req,res)=>{
  console.log(req.body);
  const name= req.body.name;
  const pass= req.body.pass
  if(admin.name==name && admin.pass==pass){
    req.session.admin=true
    //adminHelpers.verifyLogIn()
  res.redirect('/admin')
  }else{
    req.session.adminErr="Invalid Entrey"
    res.render('admin/login-page')
  }
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.render('admin/login-page')
})

router.get('/add-product',verifyLogin,(req,res)=>{
  adminHelpers.getBrand().then((allBrand) =>{
    console.log(allBrand);
  res.render('admin/add-products',{admin:req.session.admin,allBrand}); 
  }) 
});

router.get('/view-products', verifyLogin, function(req, res, next) {
  var admin =req.session.admin
  productHelpers.getAllProducts().then((products)=>{
    console.log(products);     
    res.render('admin/view-products',{admin,products})
  })
}); 

router.post('/add-product',(req,res)=>{
  console.log(req.body);
   productHelpers.addProducts(req.body,(id)=>{
    console.log(JSON.stringify(id.insertedId));
    var ID = id.insertedId
    let image = req.files.image
    image.mv('./public/product-images/'+ID+'.jpg',(err)=>{
      
      if(!err){
        mesg="Successfully Submited"
        res.render("admin/add-products",{admin:true,mesg})
      }else{
        mesg="Something wrong"+err;
        res.render("admin/add-products",{admin:true,mesg})
      }
    })
    
  })
})

router.get('/edit-product/:id',async(req,res)=>{
 let products =await productHelpers.getProductDetails(req.params.id)
 if(products){
  if(!products.productVariants){
    productHelpers.getVar(req.params.id)
    }
    adminHelpers.getBrand().then((allBrand) =>{
    if(allBrand){
    res.render('admin/edit-products',{allBrand,products,admin:req.session.admin})
   } 
})
 }else{
res.render('admin/edit-products',{products,admin:req.session.admin}) 
}
})


router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProducts(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })
    
})

router.post('/edit-product/',(req,res)=>{
  console.log(req.query.varId);
  console.log(req.files);
  productHelpers.getOneProduct(req.query.id).then((result)=>{
     let proId= req.query.id; 
     let varId= req.query.varId;
     let image = req.files?.image;
     let prodImg1 = req.files?.image_1;
     let prodImg2 = req.files?.image_2;
     let prodImg3 = req.files?.image_3;

     if(image){
      fs.unlink(
        `./public/product-images/${proId}.jpg`,
        (err,data)=>{
          if(!err){
            image.mv('./public/product-images/'+proId+'.jpg')
          }
          else{
            console.log("no maching images 0 ");
          }
        }
      )
     }if(prodImg1){
      fs.unlink(
        `./public/product-images/${proId}/${varId}_1.jpg`,
        (err,data)=>{
          if(!err){
            console.log("success :img 1");
           
          } prodImg1.mv( `./public/product-images/sample/${varId}_1.jpg`)
          
        }        
      )
         
      
     }if(prodImg2){
      fs.unlink(
        `./public/product-images/sample/${varId}_2.jpg`,
        (err,data)=>{
          if(!err){
           
          } prodImg2.mv('./public/product-images/sample/'+varId+'_2.jpg')
         
            console.log("no maching images 2");
          
        }
      )
     } if(prodImg3){
      fs.unlink(
        `./public/product-images/sample/${varId}_3.jpg`,
        (err,data)=>{
          if(!err){
           console.log("img 3 succeess");
          } prodImg3.mv('./public/product-images/sample/'+varId+'_3.jpg')
        }
      )
     }
  })
  //let id = req.params.id
  //console.log(req.files.image_1);
   productHelpers.updateProduct(req.query,req.body).then(()=>{
   res.redirect('/admin/view-products')
  //   if(req.files){
  //     let image = req.files.image
  //     image.mv('./public/product-images/'+id+'.jpg')
  //   }
   })
})


router.get("/orders",async(req,res)=>{
  let orders = await productHelpers.getUserOrders()
  console.log("Orders :"); 
  res.render('admin/orders',{res:true,orders,admin:req.session.admin})
})

router.get('/place-product/:id',(req,res)=>{
  console.log(req.params);
  productHelpers.placeOrders(req.params.id).then(()=>{
    res.json({value:true})
  })

})

router.get('/userDetails',verifyLogin,(req,res)=>{
  userHelpers.getUser().then((resolve)=>{
    res.render('admin/userDetails',{users:resolve, admin:req.session.admin})
  })
})

router.post("/block-user",(req,res)=>{
  adminHelpers.blockUser(req.body.id).then((resp)=>{
    console.log(resp);
    if (resp){
      res.json({ status:true})
    }else{
    res.json({status:false})
    }
  })
})


router.post("/unblock-user",(req,res)=>{
  adminHelpers.unblockUser(req.body.id).then((resp)=>{
    console.log(resp);
    if (resp){
      res.json({status:true})
    }else{
    res.json({status:false})
    }
  })
})
module.exports = router;
