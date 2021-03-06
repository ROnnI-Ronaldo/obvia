var JTemplate = function(_tpl, _context)
{
    var _hash = {};
    var _guid = StringUtils.guid();
    var _self = this;
    var _tempObj = null;
    const _regex = /{{(\w|[\s-+.@,/\//()?=*_\"'\[\]])+}}/g;
        
    this.parse = function()
    {
        _mutations = [];
        if(isString(_tpl))
        {
            if (_regex.test(_tpl)) {
                const matches = _tpl.match(_regex);
                matches.map(_processBinding);
            }
            _tempObj = JSON.parse(_tpl);
        }else
        {
            _tempObj = extend(true, false, _tpl);
            _processBindingsLiteral(_tempObj);
        }
        _explore(_tempObj, []);
        return _tempObj;
    };
    
    this.now = function(p, v)
    {
        v = v?v:[];
        let snapShot = p || (_tempObj.forEach ? acExtend(true, _tempObj) : extend(true, false, _tempObj));
        v.push(snapShot);
        for(var key in _hash)
        {
            if(Array.isArray(snapShot)) 
            {
                for(var i=0;i< snapShot.length;i++){
                    let len = v.push(snapShot[i]);
                    if(snapShot[i] == key)
                        snapShot.splice(i, 1);
                    else if(isObject(snapShot[i]) || Array.isArray(snapShot[i]))
                    {
                        let ind = v.indexOf(snapShot[prop]);
                        if(ind==-1 || ind >= len-1)
                            this.now(snapShot[i], v);
                    }
                }
            }else{
                for(var prop in snapShot){
                    let len = v.push(snapShot[prop]);
                    if(snapShot[prop] == key)
                        delete snapShot[prop];
                    else if(isObject(snapShot[prop]) || Array.isArray(snapShot[prop]))
                    {
                        let ind = v.indexOf(snapShot[prop]);
                        if(ind==-1 || ind >= len-1)
                            this.now(snapShot[prop], v);
                    }
                }
            }
        }
        return snapShot;
    }

    this.resetBindings = function()
    {
        for(var i=0;i<_watchers.length;i++)
        {
            _watchers[i].reset();        
        }
    };

    this.refreshBindings = function(newContext)
    {
        _context = newContext;
        this.resetBindings();
        _tempObj = JSON.parse(_tpl);
        _mutations = [];
        _explore(_tempObj, []);
        return _tempObj;
    };

    var _watchers = [];
    var _mutations = [];

    var _explore = function(obj, chain)
    {
        for(var prop in obj)
        {
            if(isString(obj[prop]) && _hash[obj[prop]])
            {
                let chainBranch = chain.slice(0);
                chainBranch.push(prop);
                //cpath
                let bindingExp = _hash[obj[prop]], nullable = false;
                if(isObject(bindingExp)){
                    nullable = bindingExp.nullable;
                    bindingExp = bindingExp.expression;
                }
                var defaultBindTo = "currentItem_"+_guid;
                _context = window[defaultBindTo] = (_context || JTemplate.defaultContext);

                var fn = function(){
                    _watchers.splicea(_watchers.length, 0, BindingUtils.getValue(_context, bindingExp, _tempObj, chainBranch, defaultBindTo));
                };
                if(nullable){
                    var fnDelayed = whenDefined(_context, bindingExp, fn);
                    fnDelayed();
                }else{
                    fn();
                }
                _mutations.push({host: _tempObj, "chain": chainBranch});
            }else if (isObject(obj[prop]) || Array.isArray(obj[prop])) 
            {
                var chainBranch = chain.slice(0);
                chainBranch.push(prop);
                _explore(obj[prop], chainBranch);
            }
        }
    }
    var _processBindingsLiteral = function(tplObj)
    {
        for(var prop in tplObj)
        {
            if(isString(tplObj[prop]) && _regex.test(tplObj[prop])) 
            {
                _regex.lastIndex = 0;
                let chash = tplObj[prop].hashCode();
                let key = "a_"+(chash<0? "n"+Math.abs(chash):chash);
                if(_hash[key]==null)
                {
                    let expr = tplObj[prop].slice(2, -2);
                    if(expr[0]=="?")
                        _hash[key] = {nullable:true, expression:expr.slice(1)};
                    else
                        _hash[key] = expr;
                }
                tplObj[prop] = key;
            }else if(isObject(tplObj[prop]) || Array.isArray(tplObj[prop]))
            {
                _processBindingsLiteral(tplObj[prop]);
            }
        }
    }

    var _processBinding = function(matched)
    {
        let chash = matched.hashCode();
        let key = "a_"+(chash<0? "n"+Math.abs(chash):chash);
        if(_hash[key]==null)
        {
            let expr = matched.slice(2, -2);
            if(expr[0]=="?")
                _hash[key] = {nullable:true, expression:expr.slice(1)};
            else
                _hash[key] = expr;
            let regex = new RegExp(matched,'g');
            _tpl = _tpl.replace(regex, '"'+key+'"');
        }
    }

    Object.defineProperty(this, "mutations",
    {
        get: function mutations()
        {
            return _mutations;
        }
    });
    
}
JTemplate.defaultContext = window;
JTemplate.prototype.ctor = 'JTemplate';