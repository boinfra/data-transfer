angular.module('data-transfer')

.factory('mockService', function(){
	var acceptedExtensions = ['*'];
	return{
		uploadFile: function(file){
			console.debug("Upload file");
		}
	};
});