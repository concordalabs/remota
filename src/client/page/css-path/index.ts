/* eslint-disable */
// TODO: fix this file, as it came from a non-module npm package and it was not made for TS

// @ts-ignore
const classSelector = function (className) {
  const selectors = className.split(/\s/g);
  const array = [];

  for (let i = 0; i < selectors.length; ++i) {
    if (selectors[i].length > 0) {
      // @ts-ignore
      array.push("." + selectors[i]);
    }
  }

  // @ts-ignore
  return array.join("");
};

// @ts-ignore
const nthChild = function (elm) {
  let childNumber = 0;
  const childNodes = elm.parentNode.childNodes;
  let index = 0;

  for (; index < childNodes.length; ++index) {
    if (childNodes[index].nodeType === 1) ++childNumber;

    if (childNodes[index] === elm) return childNumber;
  }
};

// @ts-ignore
const path = function (elm, rootNode, list) {
  const tag = elm.tagName.toLowerCase();
  const selector = [tag];
  const className = elm.getAttribute("class");
  const id = elm.getAttribute("id");

  if (id) {
    list.unshift(tag + "#" + id.trim());
    return list;
  }

  // @ts-ignore
  if (className) selector.push(classSelector(className));

  if (tag !== "html" && tag !== "body" && elm.parentNode) {
    // @ts-ignore
    selector.push(":nth-child(" + nthChild(elm) + ")");
  }

  // @ts-ignore
  list.unshift(selector.join(""));

  if (elm.parentNode && elm.parentNode !== rootNode && elm.parentNode.tagName) {
    path(elm.parentNode, rootNode, list);
  }

  return list;
};

// @ts-ignore
export default (elm, rootNode?) => path(elm, rootNode, []).join(" > ");
