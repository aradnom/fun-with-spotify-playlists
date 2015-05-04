// This has one very simple purpose - apply an ng-app attribute to the body
// WordPress Admin templates are notoriously difficult to monkey with, so
// adding this conveniently with a simple hook is out of the question.
// The other option is to manually bootstrap Angular modules, and this is also
// The Suck.  So here we are.
var admin = document.getElementsByClassName( 'wp-admin' );
if (admin.length) {
  var body = document.getElementsByTagName( 'body' );
  if (body.length) body[0].setAttribute( 'ng-app', 'App' );
}