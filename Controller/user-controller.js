let routes = require('../routes/user')
let productHelpers = require('../Helpers/product-helpers')
let collection = require('../config/collections')
let db = require('../config/connection')
const userHelpers = require('../Helpers/user-helpers')

module.exports = {
    updateUserDetails:(req,res) =>{
        console.log('wwe wwe world');
        let userId = req.session.user._id
        console.log(userId);
        userHelpers.updateUserProfile(userId,req.body);  
        res.redirect('/user-account')
    }
}
