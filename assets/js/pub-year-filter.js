(function () {
  function init() {
    var toolbar = document.querySelector(".pub-year-toolbar");
    if (!toolbar) return;

    var blocks = document.querySelectorAll(".pub-year-block");
    var buttons = toolbar.querySelectorAll(".pub-year-btn");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var year = btn.getAttribute("data-year");

        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });

        blocks.forEach(function (block) {
          var y = block.getAttribute("data-year");
          if (year === "all") {
            block.style.display = "";
            block.hidden = false;
          } else {
            var show = y === year;
            block.style.display = show ? "" : "none";
            block.hidden = !show;
            if (show) {
              block.open = true;
            }
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
