const fs = require('fs');
let temp = fs.readFileSync('temp_friends.vue', 'utf16le');
let styleStart = temp.search(/<style[\s\S]*?>/);
if (styleStart === -1) throw new Error("Could not find style block in temp_friends.vue");
let styleBlock = temp.substring(styleStart);
styleBlock = styleBlock.replace(/@include theme-light \{/g, '@include theme-light-own {');

let target = fs.readFileSync('src/views/friendsTable/FriendsTableIndexView.vue', 'utf8');
let targetStyleStart = target.search(/<style[\s\S]*?>/);
if (targetStyleStart === -1) throw new Error("Could not find style block in target file");
target = target.substring(0, targetStyleStart) + styleBlock;
fs.writeFileSync('src/views/friendsTable/FriendsTableIndexView.vue', target);
console.log("Success");
