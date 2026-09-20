/* Each notebook page changes the actual canyon and pencil allowance. */
(function(root){
  const page=(name,left,right,depth,budget,brief)=>({name,budget,brief,anchors:[{x:left,y:422},{x:right,y:422},{x:left-20,y:depth},{x:right+20,y:depth}]});
  const levels=[
    page('probably fine.',350,740,545,1500,'Join the top dots with a road. Add braces underneath.'),
    page('mind the gap.',290,800,545,1700,'A wider river. Those braces have more work to do.'),
    page('deep trouble.',310,780,588,1600,'The lower bolts are farther down. Reach them with your braces.'),
    page('last pencil.',300,790,570,1150,'One short pencil. Make every stroke count.')
  ];
  if(typeof module!=='undefined')module.exports=levels;else root.BridgeLevels=levels;
})(typeof globalThis!=='undefined'?globalThis:this);
