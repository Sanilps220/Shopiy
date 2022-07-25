
        function addToCart(proId){
            $.ajax({
                url:'/add-to-cart/'+proId,
                method:'get',
                success:(response)=>{                   
                    if(response.status){                       
                        let count=$('#cart-count').html()
                        count=parseInt(count)+1
                        $("#cart-count").html(count)
                       
                    }else{
                       swal({
                        title:"Login Please",
                        text:"It Easy do logged in",
                        button:true,
                        dangerMode:true
                       })
                       .then(()=>{
                        location.href="/login"                        
                       })
                    }
                }
            })
        }
        
       
       // function editUser(userId){
    //         let val = document.getElementById('sts')
    //         console.log(val)
            
    //         if(val.innerHTML  == "Unblock"){
    //  value = "Block"
    //             val.innerHTML  = "Block"
    //         } if(val.innerHTML  == "Blocked"){
    //  value = "Unblock"
    //             val.innerHTML  = "Unblock"
    //         }
            // $.ajax({
            //     url:'/admin/editStatus?id='+userId+'&val='+value,
            //     method:'get',
            //     success:(response)=>{
            //         alert(response.status)
            //     }
            // })
        //}
