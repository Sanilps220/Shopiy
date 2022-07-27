const { response } = require('express');
var express = require('express');
const session = require('express-session');
const { LoggerLevel } = require('mongodb');
var router = express.Router();
var productHelpers = require('../Helpers/product-helpers');
const userHelpers = require('../Helpers/user-helpers');
const userController = require('../Controller/user-controller')
var paypal = require('paypal-rest-sdk');
const { route } = require('./admin');
var bcrypt = require('bcrypt')

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    //"AXazMvBms7A3vEqxt8W_6xrLgNs_d1yvk-cKWA_JJKusjzsI9DhzFTSTyAQi3onNvqeIKC6q494nIVR-",
    //"Ac50voE8lHh3bd1d6C3p4fGRQ1-Gar6Nl6naDmwJCNUGX9U-mbiJETOLdU0LAIi783NmE7un0Ljlk7kt",
  client_secret:
    //"EEBCE6_5bRVe6XDFQnUdMM8wvxyHySwKJvLGvxTuEfwEwISXe4ADYtWmU6Bo50lpwDF-zebudqx-FmbX",
    //"EHSXVo-RmfppUTcqi5lKt3ozmtq-gDQbvzMmti4RiaUN8soN-arIDNQhQb39E4aGv4V0XU1TSvBtxeKt",
});

/*twilio */
//const accountSid = process.env.TWILIO_ACCSID;
//const authToken = process.env.TWILIO_AUTHTOKEN;
//const serviceSid = process.env.TWILIO_SERVICESID;
var sid = "ACdb0a048a93142162b8cda3cd7f95e78b"
var auth_token = "c1e7d82853e8bab8119e867811f687ee"
var serviceSid = 'VA7dfd9297e4481790522e281a467dd13f'

const twilio = require("twilio")(sid, auth_token);
/* middelware function */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next(); 
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  var user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  offerProducs = await productHelpers.getOfferProducts()
  console.log(offerProducs);
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { user, products, cartCount, offerProducs });
  });
});
/*  login page. */
router.get('/login', (req, res ) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loggedInErr });
    req.session.loggedInErr = null
  }
});

router.post('/phone-verify',(req,res,next)=>{
  
  var phone = req.body.phone
  console.log(phone);
  req.session.mob = phone; //mobile otp login number storing in session
  phone = phone.toString()
  
   userHelpers.phoneCheck(phone).then((response)=>{
     if(response.userExist){ 
        twilio.verify
        .services(serviceSid)
        .verifications.create({
        to:`+91${req.body.phone}`,
        channel:"sms",
      })
      .then((ress)=>{
        console.log(ress);
        OtpPhone=phone;        
        res.render('user/otp-verify',{OtpPhone}) 
   })
    }else{ 
      console.log("lopins");
      req.session.loggedInErr = "Invalid Phone Number";
      res.redirect("/login")
    }
  }); //data base  
  OtpPhone = null; // change to default

});



router.get("/otp-verify",async(req,res)=>{
  let phoneNumber = req.query.phonenumber;
  let otpNumber = req.query.otpnumber;
  console.log(otpNumber)
  twilio.verify
    .services(serviceSid)
    .verificationChecks.create({
      to:`+91${phoneNumber}`,
      code:otpNumber
    })
    .then((resp)=>{
      console.log("OTP success :",resp);
      if(resp.valid){
        userHelpers.phoneCheck(phoneNumber).then((response)=>{
          req.session.user = response.user;
          req.session.loggedIn = true;
          let valid =true;
          req.session.mob = null;  
          res.send(valid);
        });
      }else{
        let valid = false;
        res.send(valid);
      }
    })
});

// ===================login & sessin=================
router.post('/login', (req, res) => {
  console.log(req.body)
  if(req.body.Email && req.body.Pass){
  userHelpers.doLogin(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
     else if (response.status == "Blocked"){
      req.session.loggedInErr ="User is Blocked";
      console.log("...............blocked user.....");
      res.redirect('/login');
    }
  
    else {
      req.session.loggedInErr = "Please check your entries and try again."
      res.redirect('/login')
    }
  })
} else{
    req.session.loggedInErr = "Required all fields."
    res.redirect('/login') }
})
/*  signup page. */
let referel;
router.get('/signup', async (req, res) => {
  let referel = await req.query.referel;
  console.log(referel);
  if (!req.session?.loggedIn) {
    res.render('user/signup', { title: "shopiy", referel })
  } else { res.redirect('/') }
})
//==================================== signup ==============================
router.post('/signup',async(req, res) => {
  let details = await userHelpers.checkSignUp(req.body.Uname, req.body.Email)
  
  if(details == ""|| details == null ){
  userHelpers.doSighnup(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response     
    refereUser=req.body._id
    twilio.verify.services(serviceSid)
    .verifications.create({
      to: `+91${req.body.phone}`,
      channel: "sms",
    }) 
      .then((ress) => {
      console.log('message has sent!')
      let signupPhone = req.body.phone;
      res.render("user/signupOtp", { signupPhone, refereUser });    

  })
    .catch((err) => { console.log(err)    })
    res.redirect('/')
 
    })
      }else{
        res.render("user/signup",{message:'User Already Exist'})
      }
}) 


router.get('/signupOtp',async(req,res)=>{
  console.log(req.query.id);
  phoneNumber = req.query.phoneNumber
  otpNumber = req.query.otpnumber
  
  twilio.verify.services('VA3704506443846f0438c82a42822b0fa3')
    .verificationChecks.create({
      to: "+91" + phoneNumber,
      code: otpNumber,
    })
    .then((res)=>console.log('message has sent!')     
 
    )
  res.json({user:true})
})
/* logout */
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
});
/* cart page */
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)

  if (products.length === 0) {
    res.render('user/cart', { totalValue: 00, cartErr: true })
  } else {
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    console.log(totalValue);
    res.render('user/cart', { products, user: req.session.user._id, totalValue })
  }
})

router.get('/wishlist/:id',verifyLogin,(req,res)=>{
  console.log("Uesr :"+ req.session.user);
    productHelpers.addtoWishlist(
      req.params.id,
      req.session.user._id
    ).then(()=>{console.log("Wish list +1");
      res.json({wish:true})
  })
})

router.get('/wishlist',verifyLogin,async(req,res)=>{
  let wishList = await productHelpers.getWishlist(req.session.user._id)
    res.render("user/wishList",{user:req.session.user,wishList})
})
router.post('/wishlist',(req,res)=>{
  productHelpers.removeWish(req.body.proId,req.body.user).then((resp)=>{
    res.send(200)
  })
})

/* cart */
router.get('/add-to-cart/:id',verifyLogin,   (req, res) => {
  console.log("api ===== api ==== api");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    console.log("api call-------------------------------");
    res.json({ status: true,user:req.session.user })
  }) 
})

router.post('/change-product-quantity', (req, res, next) => {
  console.log("quanttiy :",req.body.product);
  userHelpers.changeProductQantity(req.body).then(async (response) => {
    console.log(req.body.quantity);
    if (req.body.count == -1 && req.body.quantity == 1) {
      console.log(req.body.quantity);
    } else {
      response.total = await userHelpers.getTotalAmount(req.body.user)
    }
    res.json(response) /* resopnse data convert to json then send to response */
  }) 
})

router.get('/place-order',verifyLogin, async function (req, res) {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})
 
router.post('/place-order', async (req, res) => {
  console.log('lol :',req.body);
  address = req.body.address; 
  pay = req.body['payment-method']
  if(address == "" || address == undefined || pay == undefined ){
    res.json({addressErr:true})
  }else{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    console.log(orderId);
    if(req.body.CouponCode){
      req.session.total 
    }
    if (req.body['payment-method'] === 'COD') {
      res.json({ CODSuccess: true })
    } 
    else if (req.body['payment-method'] === 'Razorpay'){  
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        console.log("resonse" + response.amount)
        res.json(response)
      })
    } 
    else {  
    //  let dollars =  
    //  dollars.toFixed(2) 
     // userHelpers.placeOrder(userId, req.body , products ,req.session.total)
     console.log("payapal :");
     var create_payment_json ={
      intent: "sale", 
      payer:{
        payment_method: "paypal",
      },
      redirect_urls:{
      return_url:'http://localhost:3000/form-success',
      cancel_url:"http://localhost:3000/",
     },
     transactions:[
      {
        item_list: {
          items: [
            {
              name: "item",
              sku: "item",
              price: "1.00",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "1.00",
        },
        description: "This is the payment description.",
      },
    ]
  };
    paypal.payment.create(create_payment_json, function(error, payment){
      if(error) {
        throw error;
      }else{
        console.log("Create Payment Response");
        console.log(payment);
        console.log(payment.transactions[0].amount);
        for(var i = 0; i < payment.links.length; i++){
          if (payment.links[i].rel === "approval_url") {
            let link = payment.links[i].href;
            link = link.toString();
            res.json({ paypal: true, url: link });
          }
        }
      }
    });
  }
  })
} 
});

router.get("/successful", (req, res) => {
  console.log("------------success paypal : ")
  req.query.PayerID;
  req.query.paymentId;

  const excute_payments_json ={
    payer_id:paymentId,
    transactions:[{
      amount:{
        currency:"USD",
        total:"10.0",
      },
  }, ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error , payment){
      if(error) {throw err;}
      else{
        console.log(JSON.stringify(payment));
        res.render("user/form-success")
      }
    }
  )
})

router.get('/form-success',verifyLogin, (req, res) => {
  console.log("hi");
  res.render('user/form-success')
})


router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})

router.post('/cancelOrder',async(req,res)=>{      
    let orders = await userHelpers.cancelOrder(req.body.orderId)
    res.json({status:true});
})
 
router.get('/view-order-products/:id',verifyLogin, async (req, res) => {
  let proId = req.params.id;
  console.log("product Id : "+proId);
  let id = req.session.user._id;
  let user = req.session.user;
  let details = await productHelpers.getOrderProducts(proId)
  res.render('user/sample', { user,details })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("Payment successfull");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log("Payment failed from Server");
    res.json({ status: 'Pament failed' })
  })
})

router.get('/proView/:id',(req,res)=>{
  userHelpers.deailedView(req.params.id).then((result)=>{
    console.log(result);
    res.render('user/proView',({product:result}))
  })  
})

router.get('/user-account',verifyLogin,(req,res)=>{
  let user = req.session.user

  console.log(user);
  res.render('user/account',{user}) 
}) 

router.post('/updateUserProfile',
              verifyLogin,
              userController.updateUserDetails
); 

router.get('/changepassword',verifyLogin,(req,res)=>{
  let user = req.session.user
  res.render("user/changePassword",{user, "msg": req.session.msg})
  msg = null;
})

router.post('/newPassword',async(req,res)=>{
  userId = req.session.user._id
  let newPass = await bcrypt.hash(req.body.password, 10)
  user = await userHelpers.updatePass(userId,newPass) 
  req.session.msg = "Success" 
    console.log(":user    trueeee");
    //res.send({"msg":req.session.msg})
  res.redirect('/changepassword')
})

router.get('/Invoice',verifyLogin,async(req,res)=>{
    let user = req.session.user._id
    let cartItems = await userHelpers.getCartProducts(user)
    let total = await userHelpers.getTotalAmount(user)
    let d = new Date()
    let date = [ d.getDate() ,d.getMonth(), d.getFullYear()]
    date[1]+=1;
    console.log("cartItems : ",cartItems);
    console.log("total :",total);    
  res.render('user/bill',{cartItems,total,date,User:req.session.user})
  console.log("User :",req.session.user);
})

module.exports = router;
