JSONP是一种实现跨域访问的手段

下面是一个例子。
它以jsonp的方式跨域调用了google的搜索api，然后展示第一条结果的链接。

@javascript#code2013041601

    // 动态添加标签
    window.addScriptTag = function(src){
        var script = document.createElement('script');
        script.setAttribute("type","text/javascript");
        script.src = src;
        document.body.appendChild(script);
    }

    // 回调函数
    window.result = function(data) {
        alert(data.responseData.results[0].unescapedUrl);
    }
     
    // 跨域访问
    addScriptTag("http://ajax.googleapis.com/ajax/services/search/web"
        + "?v=1.0&q=manxisuo&callback=result");
        
点击下面的按钮运行代码

<button onclick="eval($('#code2013041601').text())">运行</button>
