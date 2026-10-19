import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedLeadEvent,inquiryTypes,multipleTopic} from '../public/assets/form.mjs';

test('HTTP errors, failed responses and missing responses cannot produce a lead',()=>{
  for(const [ok,response] of [[false,{success:true}],[true,{success:false}],[true,null],[true,{}]]){
    assert.equal(acceptedLeadEvent(ok,response,['名刺制作']),null);
  }
});
test('sales and media inquiries have finite purpose codes and no stale production segment',()=>{
  const sales=acceptedLeadEvent(true,{success:true},['名刺制作','private@example.com'],inquiryTypes[2]);
  assert.equal(sales.inquiry_type,'sales_proposal');
  assert.equal(sales.service_type,'not_applicable');
  assert.equal(sales.service_types,'not_applicable');
  assert.ok(!JSON.stringify(sales).includes('private'));
  assert.equal(acceptedLeadEvent(true,{success:true},[],inquiryTypes[3]).inquiry_type,'media_partnership');
  assert.equal(acceptedLeadEvent(true,{success:true},[multipleTopic],inquiryTypes[0]).service_type,'multiple');
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
