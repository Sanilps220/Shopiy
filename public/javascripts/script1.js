
document.getElementById('img-container').addEventListener('mouseover',function(){
     imageZoom('fea')
})

function imageZoom(imgID){
    let img= document.getElementById(imgID)

    
    let lensfk =document.getElementById('fk')
    let lens= document.getElementById('lens')

   lensfk.style.backgroundImage = `url(${img.src})`
    lens.style.backgroundImage = `url(${img.src})`
    let ratio = 2

   lens.style.backgroundSize = (img.width * ratio)+'px'+(img.height * ratio)+'px'

    img.addEventListener("mousemove",moveLens)
    lens.addEventListener("mousemove",moveLens)
    img.addEventListener("touchmove",moveLens)
    
   function moveLens(){
        //1
        let pos = getCursor()
        console.log('pos:',pos);
         //2
         let positionLeft = pos.x - (lens.offsetWidth / 2)
         let positionTop = pos.y - (lens.offsetHeight / 2)  
         
         //5
         if(positionLeft < 0){
          positionLeft = 0
         }if(positionTop < 0){
          positionTop = 0
         }if(positionLeft > img.width - lens.offsetWidth /3){
          positionLeft = img.width - lens.offsetWidth /3
         }if(positionTop > img.height - lens.offsetHeight /3){
          positionTop = img.height - lens.offsetHeight /3
         }


         //3
         lens.style.left = positionLeft + 'px';
         lens.style.top = positionTop + 'px';
 
         //4
         lens.style.backgroundPosition = "-" + (pos.x * ratio) + "px -" + (pos.y * ratio) + "px" 
         

        //fk
        //  positionLeft = pos.x - (lensfk.offsetWidth / 2)
        //  positionTop = pos.y - (lensfk.offsetHeight / 2)  
        
      
         lensfk.style.left = positionLeft + 'px';
         lensfk.style.top = positionTop+'px'

       
        lensfk.style.backgroundPosition = "-" + (pos.x * ratio) + "px -" + (pos.y * ratio) + "px" 
   }
   function getCursor(){
    let e = window.event
    let bounds = img.getBoundingClientRect()
    //console.log('bounds');

    //console.log('e:',e);
    //console.log('bounds:',bounds);
    let x= e.pageX - bounds.left
    let y= e.pageY - bounds.top
        return {'x':x, 'y':y}
   }
}

imageZoom('fea')