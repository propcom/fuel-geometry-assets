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
			$('.js-geometry-surface.js-googlemap').each(function(){
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

				$this.trigger('create.googlemap', [map]);

				if ($(this).data('points')) {
					$.each($(this).data('points'), function(){
						if (parseInt(this)) {
							$.getJSON('/geometry/api/point/find', {point: this.valueOf(), surface: $this.data('surface')})
								.success(function(data){
									if (data && data.point_x && data.point_y) {
										map.add_point(data.point_x, data.point_y, data)
									}
								});
						} else {
							map.add_point(this.point_x, this.point_y, this);
						}
					});
				}
			});

			$(document).trigger('load.googlemap');
		}
	});

	function GoogleMap(selector, options) {
		var googlemap = this;
		var $elem = $(selector);

		options = $.extend({}, default_options, options);
		googlemap.map = new google.maps.Map($elem[0], options);

		googlemap._markers = [];
		googlemap._marker_template = $('.js-geometry-point[data-surface="'+$elem.data('surface')+'"]:first');
		googlemap._marker_template.remove();

		// Close the InfoWindow when map is clicked
		google.maps.event.addListener(googlemap.map, 'click', function(){
			if (googlemap.info) {
				googlemap.info.close();
				googlemap.info = null;
			}
		});
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

			if (mark.content == undefined) {
				var found_data = false;

				var popup = this._marker_template.clone(true);
				popup.find('.js-geometry-point-data[data-field]').each(function(){
					var field = $(this).data('field');
					var value = data[field];

					if (value) {
						found_data = true;
						$(this).html(value);
					}
					else {
						$(this).remove();
					}
				});

				mark.content = popup.wrap('<div></div>').parent().html();
				mark.found_data = found_data;
			}

			if (mark.found_data) {
				// Add new infowindow
				this.info = new google.maps.InfoWindow({
					content: mark.content
				});

				this.info.open(mark.getMap(), mark);
			}
		}
	};

	window.GoogleMap = GoogleMap;
})(jQuery);
