// Brand identity colors are kept independent of the dashboard theme.
const identities={
 'semrush.com':'#ff642d','ahrefs.com':'#0649de','seranking.com':'#ffbc00',
 'upliftai.co':'#7356ff','brightlocal.com':'#08cb35','buffer.com':'#101653',
 'activecampaign.com':'#004cff','hootsuite.com':'#ff414a','hubspot.com':'#ff5c35',
 'searchatlas.com':'#7135ef','conductor.com':'#8bc63f','outrank.so':'#8039ed','morningscore.io':'#6554c0',
 'framer.com':'#111111','webflow.com':'#146ef5','wix.com':'#111111','squarespace.com':'#222222',
 'wordpress.com':'#3858e9','elementor.com':'#92003b','duda.co':'#f66035','dorik.com':'#5138ee','figma.com':'#f24e1e',
 'youtube.com':'#ff0033','tiktok.com':'#25f4ee','instagram.com':'#e1306c','facebook.com':'#0866ff',
 'vimeo.com':'#1ab7ea','twitch.tv':'#9146ff','dailymotion.com':'#0066dc','snapchat.com':'#ffdf00','rumble.com':'#85c742',
};
export function brandColor(brand){
 const domain=(brand.domain||'').replace(/^www\./,'');
 if(identities[domain])return identities[domain];
 const compact=brand.name.toLowerCase().replace(/[^a-z0-9]/g,'');
 const known=Object.keys(identities).find(d=>d.split('.')[0]===compact);
 // Unknown identities use a stable neutral until a brand color is available.
 return known?identities[known]:'#778397';
}
