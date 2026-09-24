export async function requestWithReservation(request,url,options,reserve){
 if(request.managesReservations)return request(url,options,reserve);
 if(reserve)await reserve();
 return request(url,options);
}
