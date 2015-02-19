// Enjoy ! thxer@thxer.com
// Desktop Scroller.
// Thanks to : Chace Clark <ccdevelop23@gmail.com>.
//
// Desktop Scroller is libre software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or newer.
//
// You should have received a copy of the GNU General Public License along with
// this file. If not, see <http://www.gnu.org/licenses/>.

const Clutter = imports.gi.Clutter;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Main = imports.ui.main;


let settings;
let text, icon = null;
let desktopscroller = null;
let makeNewIcon = true;

/*************************************************************
						Settings
**************************************************************/


function SettingsHandler(uuid) {
    this._init(uuid);
}

SettingsHandler.prototype = {
    _init: function(uuid) {
	// Datas form Settings menu -> settings-schema.json
	this.settings = new Settings.ExtensionSettings(this, uuid);	
	this.settings.bindProperty(Settings.BindingDirection.IN, "showActivationAreas", "showActivationAreas", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "switchAnimationOn", "switchAnimationOn", function(){});	
	this.settings.bindProperty(Settings.BindingDirection.IN, "x", "x", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "y", "y", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "height", "height", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "width", "width", function(){});	
	// Second Are
	this.settings.bindProperty(Settings.BindingDirection.IN, "enable_second_area", "enable_second_area", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "x2", "x2", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "y2", "y2", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "height2", "height2", function(){});
	this.settings.bindProperty(Settings.BindingDirection.IN, "width2", "width2", function(){});		
    }
}

/****************************************************************
						Extension
****************************************************************/

function hideDirection()
{
    Main.uiGroup.remove_actor(icon);
    makeNewIcon = true;
}

function showDirection(dir, prevIconFilename, nextIconFilename)
{
	try
	{
		var iconFilename = prevIconFilename;
		if(dir > 0)
		{
			iconFilename = nextIconFilename;
		}
		if (makeNewIcon) {
			let textureCache = St.TextureCache.get_default();
			let directionicontexture = textureCache.load_uri_async("file://" + iconFilename, -1, -1);
			icon = new St.Bin({ style_class: 'direcion-icon', width: 500, height: 500, child: directionicontexture });
			Main.uiGroup.add_actor(icon);
			makeNewIcon = false;
		}
	
		let monitor = Main.layoutManager.primaryMonitor;
		icon.set_position(Math.floor(monitor.width / 2 - icon.width / 2),
						Math.floor(monitor.height / 2 - icon.height / 2));
		Tweener.addTween(icon,
						{ opacity: 0,
						time: 0.5,
						transition: 'easeOutQuad',
						onComplete: hideDirection });
    }
	catch (e)
	{
		global.logError(e);
	}
}



// Main class for the extension.
function main(metadata,settings)
{
	this.metadata = metadata;
	this.settings = settings;
	//set defaults for undefined variables in the metadata file	
	if(this.metadata.switchPrevIcon === undefined) {this.metadata.switchPrevIcon = "my-go-prev.svg";}
		


	
	this.enable = function()
	{
		
		var monitor = Main.layoutManager.primaryMonitor;	
		var width = this.settings.width
		var height = this.settings.height
		var x = this.settings.x
		var y = this.settings.y
		var width2 = this.settings.width2
		var height2 = this.settings.height2
		var x2 = this.settings.x2
		var y2 = this.settings.y2
		var enable_second_area = this.settings.enable_second_area

		//Exemple for debug :			
		//global.logError("SCreen = "+ this.widthScreen());
		
		// First Area
		this.ractor = new St.Button({style_class:'desktopscroller'});
		this.ractor.set_position(x,y);
		this.ractor.set_width(width);
		this.ractor.set_height(height);
		if(!this.settings.showActivationAreas)
			this.ractor.opacity = 0;
		this.ractor.connect('scroll-event', this.hook.bind(this));
		Main.layoutManager.addChrome(this.ractor, {visibleInFullscreen:true});
		
		// Second Area
		if (enable_second_area){
		this.lactor = new St.Button({style_class:'desktopscroller'});
		this.lactor.set_position(x2,y2);
		this.lactor.set_width(width2);
		this.lactor.set_height(height2);
		if(!this.settings.showActivationAreas)
			this.lactor.opacity = 0;
		this.lactor.connect('scroll-event', this.hook.bind(this));
		Main.layoutManager.addChrome(this.lactor, {visibleInFullscreen:true});

		}

		
	}
	
	
/*	FOnction for have the total multiscreen width, usefulle for expand the Areas 
	this.widthScreen = function(){
		t_width = 0
		if (Main.layoutManager.monitors[0])
			t_width += Main.layoutManager.monitors[0].width
		if (Main.layoutManager.monitors[1])
			t_width += Main.layoutManager.monitors[1].width
		if (Main.layoutManager.monitors[2])
			t_width += Main.layoutManager.monitors[2].width
		return t_width;
		
	}*/
	
	this.disable = function()
	{
		Main.layoutManager.removeChrome(this.actor)
		this.actor.destroy()
		this.overview.disconnect(this.connid0)
		this.overview.disconnect(this.connid1)
	}
	this.hook = function(actor, event)
	{
		var direction = event.get_scroll_direction();
		if(direction==0) this.switch_workspace(-1);
		if(direction==1) this.switch_workspace(1);
	}
    this.switch_workspace = function(incremental)
    {
		if(this.settings.switchAnimationOn){
			showDirection(incremental, 
				this.metadata.path+"/"+this.metadata.switchPrevIcon,
				this.metadata.path+"/"+this.metadata.switchNextIcon);
				
		}
        var index = global.screen.get_active_workspace_index();
        index += incremental;
        if(global.screen.get_workspace_by_index(index) != null) {
            global.screen.get_workspace_by_index(index).activate(global.get_current_time());
        }
    },

	this.show = function()
	{
		this.actor.show()
	}
	this.hide = function()
	{
		this.actor.hide()
	}
}

// Gnome-shell extension API.
function init(metadata) {
	settings = new SettingsHandler(metadata.uuid);
	desktopscroller = new main(metadata,settings);
	}
function enable() {
	desktopscroller.enable()
	}
function disable() {
	desktopscroller.disable()
	}

