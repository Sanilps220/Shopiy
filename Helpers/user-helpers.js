var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
var Razorpay=require('razorpay')
const { resolve, reject } = require('promise')
const { get, response, options } = require('../app')
const { prependListener } = require('process')
var objectId = require('mongodb').ObjectId

var instance = new Razorpay({
    key_id: 'rzp_test_QH34rl1N5IfMxp',
    key_secret: 'SenVXu39BVxXfekGdlCjqzXu',
  });

module.exports = {
    doSighnup: function (userData) {
        return new Promise(async (resolve, reject) => {
            userData.Pass = await bcrypt.hash(userData.Pass, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {

                var objectId = userData;
                resolve(objectId)
            })
        })

    },
    doLogin: function (userData) {
        return new Promise(async function (resolve, reject) {
            let logginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Pass, user.Pass).then((status) => {
                    if (status) {
                        console.log('login a user:');
                        response.user = user
                        response.status = true
                        console.log(response.user);
                        resolve(response);
                    } else {
                        console.log('login failed');
                        resolve({ status: false ,user})
                    }
                    resolve({ status: false })
                })
            } else {
                console.log('err email id');
                resolve({ status: false })
            }
        })
    },

    checkSignUp:(name,email)=>{
        return new Promise(async(resolve,reject)=>{
            let details = db.get().collection(collection.USER_COLLECTION).find({Uname:name,Email:email})
            .toArray()
            resolve(details);
        })
    },


    phoneCheck:(userPhone) =>{
        return new Promise(async(resolve,reject)=>{
           let user = await db
           .get().collection(collection.USER_COLLECTION)
           .findOne({phone: userPhone});
           if(user){
            console.log("userExist ");
            resolve({userExist:true,user})
           }else{
            console.log("userExist : flase");
            resolve({userExist:false})
           }
            
        });
    },

    addToCart: (proId, userId) => {   /* products id each producs & which user */
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }
                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((respose) => {
                    resolve(resolve)
                })
            }
        })
    },

      getCartProducts: (userId) => {
        console.log("get CArt");
        console.log(objectId(userId))
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                }, {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
            console.log("items"+cartItems);

        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQantity: (details) => {
          details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                     db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response)=>{
                        resolve({removeProduct:true})
                    })
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({status:true})
                    })
               
            }

        })
    },

    getTotalAmount: (userId)=>{
            console.log(userId+"total");
            return new Promise(async(resolve, reject) => {
                let  discount =await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId)}
    
                    }, {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                  
                    {
                        $project:{ price: { $arrayElemAt:['$product.price',0]},quantity:1,item:1,  qty: { $in: [45,"$product.discount"] },discount: { $arrayElemAt:['$product.discount',0]}}
                    },
                    { 
                        $match:{
                            discount:{ $gte:10}
                        }
                    }
                    // ,discount:"$product.discount",price:"$product.price",quantity:1,item:1
                    
                ]).toArray()
                 var arr =discount
                console.log("ooooooo");
                console.log(arr.length);
                if(arr.length >0){
                await discount.map(async(product)=>{
                    let productPrice = product.price 
                    let value = product.quantity
                    let discountP = product.discount                   
                    let discountPrice = productPrice - ((productPrice*discountP)/100) 
                    discountPrice  = productPrice - discountPrice
                    discountPrice *= value
                   
                   // discountPrice = discountPrice.toFixed(2)
                    console.log(discountPrice );
               
                
                
                
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
    
                    }, {
                        $unwind: '$products' 
                    },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, category:1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    { 
                        $group:{
                            _id:null,
                            total:{$sum:{ $multiply:["$quantity","$product.price"]}}
                        }
                    }
                ]).toArray()
                let maxValu = total[0].total
                let totalV =  maxValu - discountPrice
                resolve(totalV)
            })  
        }else
        {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                }, {
                    $unwind: '$products' 
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, category:1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                { 
                    $group:{
                        _id:null,
                        total:{$sum:{ $multiply:["$quantity","$product.price"]}}
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        }
        })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status = order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    order:order.address,
                    pincode:order.pincode 
                },
                userId:objectId(order.userId),
                PaymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECCTION).insertOne({orderObj})
                .then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)
                })
                try {
                    if(response.ops == []) throw "empty"
                }
                catch(err){
                    console.log("nice errr");
                    resolve();
                }   
            
            resolve(response.insertedId) 
        }) 
        })
    },

    getCartProductList:function(userId){

        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })  
    },
    getUserOrders:function(userIds){
        console.log("++++++++");
        console.log(objectId(userIds));
        return new Promise(async(resolve,reject)=>{
                let orders =await db.get().collection(collection.ORDER_COLLECCTION).find({"orderObj.userId":objectId(userIds)})
                .sort({"orderObj.date":-1})
                .toArray()
            
                resolve(orders)
        })
    },

  
    generateRazorpay:function(orderId,total){ 
        console.log(orderId);
        return new Promise((resolve,reject)=>{
         
           var options={
                amount: total*100,  
                currency: "INR",  
                receipt: ""+orderId };
                 
                 instance.orders.create(options,(err,order)=>{
                    if(err){
                        console.log(err); 
                    }else{
                    console.log("New Order :",order);
                    resolve(order)
                    }
                }) 
        }) 
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
              const crypto = require('crypto');
              let hmac = crypto.createHmac('sha256', 'SenVXu39BVxXfekGdlCjqzXu');

              hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
           
              hmac=hmac.digest('hex')
              console.log("Hash key : "+hmac);
              if(hmac==details['payment[razorpay_signature]']){
                console.log("hash resolved : true");
                resolve()
              }else{
                console.log("hash rejected : faild");
                reject()
              }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECCTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{  
                     "orderObj.status":'placed' 
                    }
            }
            ).then(()=>{
                resolve()
            })
        })
    },

    cancelOrder:(orderId)=>{
        console.log(orderId);
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.ORDER_COLLECCTION)
            .updateOne({"_id":objectId(orderId)},
             {
                $set:{
                    OrderStatus:true,"orderObj.status": "cancelled",cancelStatus:true
                }
            }); 
            resolve();
        })
    },
    deailedView:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .findOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getUser:()=>{
        return new Promise((resolve,reject)=>{
           let user = db.get().collection(collection.USER_COLLECTION).find()
            .toArray()           
            resolve(user)
        })
    },

    updatePass :(userId,newPass) => { 
        return new Promise((resolve,reject)=>{
             db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},
            {
            $set:{
                "Pass":newPass
            }
        })
            resolve(response)
           
        })
    }
     ,
     updateUserProfile:(userId,body) => {
        console.log(body);
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},
            {
            $set:{
                   "Uname": body.name,
                   "Email" : body.email,
                   "phone": body.phone,
                   "address": body.address,
                   "address1": body.address2,
                }
            })
            
            console.log();
        })  
    }
}