var google = google || null;

(function($){
	var default_options;

	$(function (){
		if (google == null) {
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'http://maps.googleapis.com/maps/api/js?sensor=false&callback=googlemap_init';
			document.body.appendChild(script);
		}

		window.googlemap_init = function() {
			default_options = {
				center:  new google.maps.LatLng(55.378051, -3.435973), // England
				zoom: 5,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			// Need to wait until Google has finished before we can do default behaviour
			$('.js-googlemap').each(function(){
				var $this = $(this);

				var options = {};
				if ($this.data('lat') && $this.data('lon')) {
					options.center = new google.maps.LatLng($this.data('lat'), $this.data('lon'));
				}
				if ($this.data('zoom')) {
					options.zoom = $this.data('zoom');
				}

				var map = new GoogleMap(this, options);
				$this.data('googlemap', map);

				$(document).trigger('create.googlemap', [map]);

				var surface = $(this).data('surface');

				$.getJSON('/geometry/api/surface/all_points?surface='+surface)
					.success(function(data){
						data && $.each(data, function(){
							map.add_point(this.point_x, this.point_y, this.data);
						});
					});
			});

			$(document).trigger('load.googlemap');
		}
	});

	function GoogleMap(selector, options) {
		var $elem = $(selector);
		options = $.extend({}, default_options, options);
		this.map = new google.maps.Map($elem[0], options);

		this._markers = [];
		this._info = null;
	}

	GoogleMap.prototype = {
		add_point: function(lat, lng, data) {
			var marker = new google.maps.Marker({
				map: this.map,
				position: new google.maps.LatLng(lat,lng),
				animation: google.maps.Animation.DROP
			});

			this._markers.push(marker);

			if (data) {
				var googlemap = this;
				google.maps.event.addListener(marker, 'click',
					function() {
						googlemap.marker_click(this, data);
					}
				);
			}
		},

		center_map: function(lat, lng, zoom) {
			zoom = (typeof zoom !== 'undefined') ? zoom : default_options.zoom;

			map.setCenter(google.maps.LatLng(lat, lng));
			map.setZoom(zoom);
		},

		reset_map: function() {
			map.setCenter(default_options.center);
			map.setZoom(default_options.zoom);
		},

		marker_click: function(mark, data) {
			// Remove any existing infowindow
			if (this.info) {
				this.info.close();
				this.info = null;
			}

		    // Add new infowindow
		    this.info = new google.maps.InfoWindow({
		    	content: '<div class="infowindow"><div class="infowindow-title">' + data + '</div></div>'
		    });

		    this.info.open(mark.getMap(), mark);
		}
	};

	window.GoogleMap = GoogleMap;
})(jQuery);
