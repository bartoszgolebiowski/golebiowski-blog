---
title: 'React async form with multiple selection'
date: '2022-06-01'
tags: ['form','formik','tree','testing', 'async']
draft: true
summary: 'Let's assume a situation like this. You are a moderator on a social media app. You got the report that users with the nickname "Legend27" and "Bob123" do not behave well in the comment section. You just collected all suspicious comments, but the manager told you that "Legend27" is specially treated and can not get account suspension. To handle this situation you should unselect the "Legend27" value from the "users" input, and the application should clean up only values related to the unselected user, but the rest of the comments leave without modification.'
---

# Introduction

Let's assume a situation like this. You are a moderator on a social media app. You got the report that users with the nickname "Legend27" and "Bob123" do not behave well in the comment section. You just collected all suspicious comments, but the manager told you that "Legend27" is specially treated and can not get account suspension. To handle this situation you should unselect the "Legend27" value from the "users" input, and the application should clean up only values related to the unselected user, but the rest of the comments leave without modification.
