// Injecter les fonctions quand la page charge
window.onload = function(){
	var s = document.createElement('script');
	s.src = chrome.runtime.getURL('index.js');
	s.onload = function() {
    	this.remove();
	};
	(document.head || document.documentElement).appendChild(s);
}