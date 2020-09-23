module.exports = fn => {
  //console.log ('inside catchAsync:');
  return (req, res, next) => {
  fn(req, res, next).catch(next);
  }
}
