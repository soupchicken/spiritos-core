const profile = require('../models/Profile');
const validate = require('../shared/validate');

const stripInvalidFields( validFields, rawObj )(
  Object.keys( rawObj ).map(key, key => {
    if ( includes( validFields, key ))
      return eventObj[key];
  })
)

const profileFactory = ( async rawObj, db ) => {
  const validFields = ['username','email','is_verified'];
  const profileObj = stripInvalidFields( validFields, rawObj )
  const { isValid, errors } = validate.models.Profile( profileObj )
  isValid ?
    return new Profile( profileObj, db ) :
    throw new Error(JSON.stringify( errors ));
});

module.exports = profileFactory;
