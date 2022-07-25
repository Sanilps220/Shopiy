// paypal.Buttons({
//     style:{
//         color:'blue',
//         shape:'pill'
//     },
//     createOrder: function(data,actions){
//         return actions.order.create({
//             purchase_units:[{
//                 amount: {
//                     value:'0.1'
//                 }
//             }]
//         });
//     },
//     onApprove: function (data, actions){
//         return actions.order.capture().then(function (details) {
//             console.log(details);
//             window.location.replace("http://localhost:63342/tutorial/paypal/success.php")
//         } )
//     },
//     onCancel:function (data) {
//         window.location.replace("http://localhost:63342/tutorial/paypal/Oncancel.php")
//     }
// }).render('#payapal-payment-button')

paypal.Buttons({
    style: {
        color: 'gold',
        shape: ''
    },
    createOrder: function (data, actions) {
        console.log(data)
        console.log(actions)
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '0.5'
                }
            }]
        });
    },
    onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
            console.log(details)
            window.location.replace("http://localhost:3000/")
        })
    },
    onCancel: function (data) {
        window.location.replace("http://localhostt:3000/")
    }
}).render('#paypal-payment-button');

