function onDragStart(event) {
    event
      .dataTransfer
      .setData('text/plain', event.target.id);
  
    event
      .currentTarget
      .style
      .backgroundColor;
}

function onDragOver(event) {
    event.preventDefault();
}

function onDrop(event) {
    const id = event
        .dataTransfer
        .getData('text');

    const draggableElement = document.getElementById(id);
    const dropzone = event.target;
    dropzone.appendChild(draggableElement);
    
    let out = document.getElementById("output");
    let el = document.getElementById("val")

    // el.textContent = parseInt(el.textContent) + 1;

    let newT = dropzone.id;
    let value = el.textContent;

    out.textContent = `value ${value} inside ${newT}`;

    event
        .dataTransfer
        .clearData();
}


function add(event) {
    let el = document.getElementById("val")
    el.textContent = parseInt(el.textContent) + 1;
}

function substract(event) {
    let el = document.getElementById("val")
    el.textContent = parseInt(el.textContent) - 1;
}