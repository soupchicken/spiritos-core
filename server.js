// 'use strict';
/*
==========================================================================================================
  V1
========================================================================================================*/

require('dotenv').config()
const fs = require('fs');
const pg = require('pg');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const koaBody = require('koa-body');
const koaMorgan = require('koa-morgan');

const core = new Koa();
const coreRouter = new KoaRouter();
core.context.dbPool = new pg.Pool({
  max:process.env.PGPOOLSIZE_GATEWAY // Pulls other defaults (PGPORT, PGHOST) from process.env
});
core.use( koaBody() );
core.use(( ctx, next ) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  return next();
})

// Fetch new pool client on request
core.use( async ( ctx, next ) => {
  ctx.db = await ctx.dbPool.connect();
  return next();
})
// Close pool client after use
core.use( async ( ctx, next ) => {
  await next();
  if ( ctx.db )
    ctx.db.release();
})

const Profile = require('./v1/models/Profile')
coreRouter.get('/v1/profile/:profile_id', async ( ctx, next ) => {
  const { db, request } = ctx;
  const profileId = ctx.params.profile_id;
  console.log( profileId );
  try {
    const res = await db.query(`
      SELECT * FROM profile WHERE
      id=$1`,
      [ profileId ]);
    if (!res.rows[0])
      throw new Error('Profile not Found');
    const profile = new Profile( res.rows[0], db );
    ctx.body = await profile.toHAL();

  } catch ( error ){
    throw new Error(error.message)
  }
})



// Error handler
core.use( async ( ctx, next ) => {
  try {
    await next();
  } catch ( err ){
    ctx.status = err.status || 500;
    ctx.body = { status: ctx.status, message: err.message };
    ctx.app.emit('core-error', err, ctx);
  }
})
core.on('oauth-error', ( err, ctx ) => {
  console.log('OAUTH_ERROR', ctx.body, ctx.status );
});

coreRouter.get('/health', ( ctx, next ) => ctx.status = 200 )
core
  .use( coreRouter.routes() )
  .use( coreRouter.allowedMethods() )
  .listen( process.env.PORT || 7753 )
