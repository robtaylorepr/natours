class APIFeatures {
    constructor (query, queryString) {
        this.query       = query;
        this.queryString = queryString;
    }

  filter () {
    const queryObj = {...this.queryString}; // make copy of req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced Filtering: {duration: {gte: 5} }  =>   {duration: {$gte: 5} }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}` );
      
    this.query.find(JSON.parse(queryStr))

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(typeof(sortBy));
      this.query = this.query.sort(sortBy);
    } else {
        this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = req.query.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
        this.query = this.query.select(`-__v`);
    }

    return this;
  }

  paginate() {
    // page=3&liit=10   ->   dispolay 21-30, so skip 20  = (3-1)*10
    const page  = this.queryString.page  * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip  = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
