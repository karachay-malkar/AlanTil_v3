(function () {

  const viewDicts = document.getElementById("viewDicts");
  const viewLearnMenu = document.getElementById("viewLearnMenu");
  const btnOpenLearnMenu = document.getElementById("btnOpenLearnMenu");

  function showView(v){
    [viewDicts, viewLearnMenu].forEach(x=>x.classList.add("hidden"));
    v.classList.remove("hidden");
  }

  btnOpenLearnMenu.addEventListener("click", ()=>{
    showView(viewLearnMenu);
  });

})();