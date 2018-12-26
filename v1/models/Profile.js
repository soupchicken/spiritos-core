const validate = require('../shared/validate');

//TODO: Move to utilities
const asyncForEach = async function(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

//TODO: Move to generic base class
class Model {

  async toJSON(){
    const { self } = this;
    return {
      ...self
    }
  }

  async toHAL(){
    const { name, db, embeddedModels, self } = this;
    const _embedded = {};
    await asyncForEach( embeddedModels, async embedded_model => {
      const embed = await db.query(`
        SELECT * FROM ${embedded_model} WHERE id IN (
          SELECT ${embedded_model}_id FROM ${name}_${embedded_model} WHERE ${name}_id=$1 )`,
        [ self.id ]);
      _embedded[embedded_model] = embed.rows;
    })
    return {
      ...self,
      _embedded
    }
  }

}

class Profile extends Model {

  constructor( props, db ){
    super( props );
    this.name = 'profile';
    this.db = db;
    this.embeddedModels = ['community'];
    this.self = { ...props }
  }

}

module.exports = Profile;
