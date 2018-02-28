    angular.module('workfit').controller('FaqController', FaqCtrl);

    function FaqCtrl($scope, QuestionsNew) {
        QuestionsNew.then(function(data) {
            document.getElementById('spinner').style.display = 'none';
            $scope.$apply(function() {
                $scope.faqs = data.faq;
                $scope.show = false;
            });
        });
    }
