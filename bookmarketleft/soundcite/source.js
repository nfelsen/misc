var els = document.getElementsByTagName("a");
for (var i = 0, l = els.length; i < l; i++) {
    if (els[i] && (arr = els[i].href.match(/data-id%3D%22(.*)%22%20.*data-start%3D%22(.*)%22%20data-end%3D%22(.*)%22%3E/))) {
        console.log("ok %s", els[i].href);
        var newSpan = document.createElement('span');
        newSpan.setAttribute('class', 'soundcite');
        newSpan.setAttribute('data-id', arr[1]);
        newSpan.setAttribute('data-start', arr[2]);
        newSpan.setAttribute('data-end', arr[3]);
        newSpan.innerHTML = els[i].innerHTML;
        els[i].parentNode.insertBefore(newSpan, els[i]); 
        els[i].remove();
        new soundcite.SoundCloudClip(newSpan)
    }
}
