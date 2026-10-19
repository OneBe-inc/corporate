import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedLeadEvent} from '../public/assets/form.mjs';

test('HTTP errors, failed responses and missing responses cannot produce a lead',()=>{
  for(const [ok,response] of [[false,{success:true}],[true,{success:false}],[true,null],[true,{}]]){
    assert.equal(acceptedLeadEvent(ok,response,['名刺制作']),null);
  }
});
test('accepted inquiries contain only fixed service codes, never entered values',()=>{
  const event=acceptedLeadEvent(true,{success:'true'},['名刺制作','private@example.com','名刺制作']);
  assert.equal(event.service_type,'business_card');
  assert.equal(event.service_types,'business_card');
  assert.equal(event.form_id,'corporate_contact');
  assert.ok(!JSON.stringify(event).includes('private'));
});
test('multiple services produce one event payload, with a stable category and finite codes',()=>{
  const event=acceptedLeadEvent(true,{success:true},['ロゴ制作','チラシ・ポスター制作','ロゴ制作']);
  assert.equal(event.service_type,'multiple');
  assert.equal(event.service_types,'flyer,logo');
  assert.equal(acceptedLeadEvent(true,{success:true},[]).service_type,'other');
});
